"""Browser regression checks. Run the static server on port 5500 first.

Requires Python Playwright and Chromium; no dependency is added to the app.
Every test uses an isolated browser context and only dummy data.
"""
import os
import unittest
from datetime import date, timedelta
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get('REOUTFIT_TEST_URL', 'http://127.0.0.1:5500/')
ROOT = Path(__file__).resolve().parents[1]
PHOTO = str(ROOT / 'dist/assets/korean.webp')
SHARED = 'reoutfit.demo.shared.v1'


class BrowserFlows(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pw = sync_playwright().start()
        cls.browser = cls.pw.chromium.launch(executable_path=os.environ.get('REOUTFIT_CHROMIUM', '/usr/bin/chromium'), headless=True)

    @classmethod
    def tearDownClass(cls):
        cls.browser.close()
        cls.pw.stop()

    def setUp(self):
        self.context = self.browser.new_context(viewport={'width': 1440, 'height': 1000})
        self.errors = []
        self.page = self.new_page()
        self.page.goto(BASE, wait_until='networkidle')

    def tearDown(self):
        self.context.close()
        self.assertEqual(self.errors, [], 'Browser JavaScript errors')

    def new_page(self):
        page = self.context.new_page()
        page.on('pageerror', lambda error: self.errors.append(str(error)))
        return page

    def seed_account(self, page, identifier='renter-demo', verification='verified'):
        page.evaluate("""([id, verification]) => {
          const key = 'reoutfit.demo.accounts.v1';
          const saved = JSON.parse(localStorage.getItem(key) || '{"version":1,"accounts":{}}');
          saved.accounts[id] = {registered:true,verification};
          localStorage.setItem(key,JSON.stringify(saved));
          sessionStorage.setItem('reoutfit.demo.account.session.v1',id);
        }""", [identifier, verification])
        page.reload(wait_until='networkidle')

    def order_count(self, page=None):
        return (page or self.page).evaluate("JSON.parse(localStorage.getItem('reoutfit.demo.shared.v1') || '{\"orders\":[]}').orders.length")

    def choose_outfit(self, days=3):
        self.page.goto(BASE + '#/outfit/korean')
        expect(self.page.locator('#booking')).to_be_visible()
        start = date.today() + timedelta(days=2)
        while any((start + timedelta(days=n)).day in (8, 9, 18) for n in range(days)):
            start += timedelta(days=1)
        self.page.locator('#start').fill(start.isoformat())
        self.page.locator('#start').dispatch_event('change')
        self.page.locator('#days').select_option(str(days))
        self.page.locator('#booking button[type=submit]').click()
        expect(self.page.locator('#checkoutForm')).to_be_visible()
        return start.isoformat()

    def fill_checkout(self, courier=False):
        self.page.locator('#checkout-fill-demo').click()
        if courier:
            self.page.locator('[name=delivery][value=courier]').check()
        self.page.locator('[name=agree]').check()

    def test_guest_catalog_details_and_summary(self):
        expect(self.page.get_by_role('heading', name='Sewa outfit', exact=True)).to_be_visible()
        expect(self.page.locator('#modal')).not_to_be_visible()
        self.page.goto(BASE + '#/jelajah')
        expect(self.page.locator('#catalog-products .product')).to_have_count(4)
        self.page.locator('#category').select_option('Dress')
        expect(self.page.locator('#catalog-products .product')).to_have_count(1)
        self.page.locator('#reset').click()
        self.page.locator('#search').fill('Midnight Royal')
        expect(self.page.locator('#catalog-products .product')).to_have_count(1)
        self.choose_outfit()
        expect(self.page.locator('#checkout-costs .total strong')).to_have_text('Rp281.500')
        self.assertEqual(self.order_count(), 0)

    def test_new_account_later_reject_retry_and_duplicate_confirmation(self):
        start = self.choose_outfit()
        self.fill_checkout(courier=True)
        self.page.locator('#checkout-confirm').click()
        self.page.locator('[data-account-mode=register]').click()
        self.page.locator('#accountForm [type=submit]').click()
        self.page.locator('[data-account-later]').click()
        expect(self.page.locator('#modal')).not_to_be_visible()
        expect(self.page.locator('[name=receiver]')).to_have_value('Nara Demo')
        expect(self.page.locator('#checkout-costs .total strong')).to_have_text('Rp321.500')
        self.assertEqual(self.order_count(), 0)
        self.page.locator('#checkout-confirm').click()
        expect(self.page.locator('.account-dummy-watermark')).to_have_text('CONTOH / TIDAK BERLAKU')
        expect(self.page.locator('#modal input[type=file]')).to_have_count(0)
        self.page.locator('[data-account-submit]').click()
        expect(self.page.locator('[data-account-status=pending]')).to_be_visible()
        self.assertEqual(self.order_count(), 0)
        self.page.locator('[data-account-reject]').click()
        expect(self.page.locator('[data-account-status=rejected]')).to_be_visible()
        self.assertEqual(self.order_count(), 0)
        self.page.locator('[data-account-submit]').click()
        self.page.locator('[data-account-approve]').click()
        expect(self.page).to_have_url(BASE + '#/pesanan')
        self.assertEqual(self.order_count(), 1)
        saved = self.page.evaluate("JSON.parse(localStorage.getItem('reoutfit.demo.shared.v1')).orders[0]")
        self.assertEqual(saved['start'], start)
        self.assertEqual(saved['total'], 321500)
        self.assertEqual(saved['paymentStatus'], 'unpaid-demo')
        self.assertNotIn('receiver', saved)
        self.assertNotIn('address', saved)
        self.assertNotIn('identityImage', saved)
        expect(self.page.locator('main')).to_contain_text('Belum diproses · simulasi')

    def test_checkout_errors_cancel_and_navigation_keep_fields(self):
        self.choose_outfit(1)
        self.page.locator('[name=receiver]').fill('   ')
        self.page.locator('[name=phone]').fill('++++++++')
        self.page.locator('[name=payment][value=cod]').check()
        self.page.locator('[name=delivery][value=courier]').check()
        expect(self.page.locator('[name=payment][value=cod]')).to_be_disabled()
        expect(self.page.locator('[name=payment][value=qris]')).to_be_checked()
        self.page.locator('#checkout-confirm').click()
        expect(self.page.locator('#checkout-receiver-error')).to_contain_text('wajib diisi')
        expect(self.page.locator('#checkout-phone-error')).to_contain_text('valid')
        expect(self.page.locator('#checkout-address-error')).to_contain_text('wajib diisi')
        self.fill_checkout(courier=True)
        self.page.locator('#checkout-confirm').click()
        self.page.keyboard.press('Escape')
        expect(self.page.locator('#modal')).not_to_be_visible()
        expect(self.page.locator('#checkout-confirm')).to_be_enabled()
        expect(self.page.locator('[name=receiver]')).to_have_value('Nara Demo')
        self.page.locator('#checkout-edit-schedule').click()
        self.page.locator('#booking button[type=submit]').click()
        expect(self.page.locator('[name=receiver]')).to_have_value('Nara Demo')
        expect(self.page.locator('[name=address]')).to_have_value('Jalan Contoh No. 10, Kota Demo')

    def test_verified_double_submit_and_storage_failure(self):
        self.seed_account(self.page)
        self.choose_outfit()
        self.fill_checkout()
        self.page.evaluate("""() => {
          window.originalSetItem = Storage.prototype.setItem;
          Storage.prototype.setItem = function(key,value) {
            if (key === 'reoutfit.demo.shared.v1') throw new DOMException('test quota','QuotaExceededError');
            return window.originalSetItem.call(this,key,value);
          };
        }""")
        self.page.locator('#checkout-confirm').click()
        expect(self.page.locator('#checkout-submit-error')).to_contain_text('belum tersimpan')
        expect(self.page.locator('[name=receiver]')).to_have_value('Nara Demo')
        self.page.evaluate('() => { Storage.prototype.setItem = window.originalSetItem; }')
        self.page.locator('#checkoutForm').evaluate("form => { form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); }")
        expect(self.page).to_have_url(BASE + '#/pesanan')
        self.assertEqual(self.order_count(), 1)

    def fill_listing(self):
        self.page.goto(BASE + '#/upload')
        self.page.locator('#outfitPhotos').set_input_files(PHOTO)
        expect(self.page.locator('#photoPreview img')).to_have_count(1)
        data = {'name':'Outfit Demo Baru','brand':'Brand demo','material':'Katun','description':'Outfit contoh untuk pengujian lokal, termasuk satu atasan.','condition':'Baik, contoh data','chest':'90','waist':'70','length':'60','original':'1000000','price':'55000','deposit':'100000','replacement':'900000','terms':'Pencucian normal termasuk harga sewa contoh.'}
        for name,value in data.items():
            self.page.locator(f'#uploadForm [name="{name}"]').fill(value)
        self.page.locator('#listing-agree').check()

    def test_listing_draft_errors_photos_and_verification(self):
        self.fill_listing()
        expect(self.page.locator('[name=original]')).to_have_value('1.000.000')
        self.page.locator('#merchantPrice').fill('0')
        self.page.locator('#publishListing').click()
        expect(self.page.locator('#merchantPriceError')).to_contain_text('lebih dari Rp0')
        self.page.locator('#merchantPrice').fill('55000')
        self.page.locator('[name=brand]').fill('   ')
        self.page.locator('#publishListing').click()
        expect(self.page.locator('#listing-brandError')).to_contain_text('wajib diisi')
        self.page.locator('[name=brand]').fill('Brand demo')
        self.page.locator('#outfitPhotos').set_input_files({'name':'bad.svg','mimeType':'image/svg+xml','buffer':b'<svg/>'})
        expect(self.page.locator('#outfitPhotosError')).to_contain_text('JPEG, PNG, atau WebP')
        expect(self.page.locator('#photoPreview img')).to_have_count(1)
        self.page.locator('#outfitPhotos').set_input_files(PHOTO)
        expect(self.page.locator('#outfitPhotosError')).to_have_text('')
        self.page.locator('#saveListingDraft').click()
        self.page.goto(BASE + '#/jelajah')
        self.page.goto(BASE + '#/upload')
        expect(self.page.locator('[name=name]')).to_have_value('Outfit Demo Baru')
        expect(self.page.locator('#photoPreview img')).to_have_count(1)
        self.page.locator('#publishListing').click()
        expect(self.page.locator('#accountForm')).to_be_visible()
        self.page.locator('#accountAlias').select_option('owner-lemari-kamu')
        self.page.locator('#accountForm [type=submit]').click()
        expect(self.page.locator('.account-dummy-watermark')).to_be_visible()
        self.page.keyboard.press('Escape')
        expect(self.page.locator('#publishListing')).to_be_enabled()
        expect(self.page.locator('[name=name]')).to_have_value('Outfit Demo Baru')
        self.page.locator('#publishListing').click()
        self.page.locator('[data-account-submit]').click()
        self.page.locator('[data-account-approve]').click()
        expect(self.page).to_have_url(BASE + '#/merchant')
        expect(self.page.locator('main')).to_contain_text('Outfit Demo Baru')
        expect(self.page.locator('.listing-row')).to_have_count(1)

    def test_completed_rental_review_and_account_isolation(self):
        self.seed_account(self.page)
        self.choose_outfit()
        self.fill_checkout()
        self.page.locator('#checkout-confirm').click()
        expect(self.page).to_have_url(BASE + '#/pesanan')
        expect(self.page.locator('[data-review]')).to_have_count(0)
        owner = self.new_page()
        owner.goto(BASE)
        self.seed_account(owner, 'owner-lemari-nara')
        owner.goto(BASE + '#/pesanan')
        initial = owner.locator('[data-condition-upload][data-stage=initialConditionPhotos]')
        initial.locator('[data-condition-input]').set_input_files(PHOTO)
        initial.locator('[data-condition-save]').click()
        expect(self.page.locator('[data-receive]')).to_be_enabled()
        self.page.locator('[data-receive]').click()
        self.page.locator('#evidence').set_input_files(PHOTO)
        self.page.locator('[name=conditionAgree]').check()
        self.page.locator('#receiveForm [type=submit]').click()
        expect(self.page.locator('a[href^="#/pengembalian/"]')).to_be_visible()
        self.page.locator('a[href^="#/pengembalian/"]').click()
        self.page.locator('[name=condition]').select_option('Baik, sesuai kondisi awal')
        self.page.locator('#evidence').set_input_files(PHOTO)
        self.page.locator('#returnForm [type=checkbox]').check()
        self.page.locator('#returnForm [type=submit]').click()
        expect(self.page).to_have_url(BASE + '#/pesanan')
        final = owner.locator('[data-condition-upload][data-stage=finalConditionPhotos]')
        expect(final).to_be_visible()
        final.locator('[data-condition-input]').set_input_files(PHOTO)
        final.locator('[data-condition-save]').click()
        # Wait for saved evidence, not the temporary file preview during compression.
        expect(owner.locator('.condition-comparison .condition-evidence-list img')).to_have_count(2)
        owner.locator('[data-inspect]').click()
        review = self.page.locator('[data-review][data-review-side=renter]')
        expect(review).to_be_visible()
        review.click()
        self.page.locator('#reviewForm textarea').fill('Komentar tetap tersedia')
        self.page.locator('#reviewForm [type=submit]').click()
        expect(self.page.locator('#reviewRatingError')).to_contain_text('1–5')
        expect(self.page.locator('#reviewForm textarea')).to_have_value('Komentar tetap tersedia')
        self.page.locator('#reviewForm [name=rating][value="5"]').check()
        self.page.locator('#reviewForm textarea').evaluate("el => { el.value = 'a'.repeat(501); }")
        self.page.locator('#reviewForm [type=submit]').click()
        expect(self.page.locator('#reviewTextError')).to_contain_text('500')
        self.page.locator('#reviewForm textarea').fill('<img src=x onerror=alert(1)> Contoh ulasan')
        self.page.locator('#reviewForm').evaluate("form => { form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); form.dispatchEvent(new Event('submit',{bubbles:true,cancelable:true})); }")
        expect(self.page.locator('#modal')).not_to_be_visible()
        expect(self.page.locator('[data-review][data-review-side=renter]')).to_have_count(0)
        self.page.goto(BASE + '#/outfit/korean')
        expect(self.page.locator('main')).to_contain_text('<img src=x onerror=alert(1)> Contoh ulasan')
        expect(self.page.locator('img[src=x]')).to_have_count(0)
        self.page.goto(BASE + '#/pesanan')
        self.page.locator('[data-account]').click()
        self.page.locator('[data-account-switch]').click()
        self.page.locator('#accountAlias').select_option('renter-demo-2')
        self.page.locator('#accountForm [type=submit]').click()
        self.page.locator('[data-account-close]').click()
        expect(self.page.locator('.checkout-grid')).to_have_count(0)
        expect(self.page.locator('main')).to_contain_text('Belum ada pesanan')

    def test_two_tabs_cannot_book_the_same_period(self):
        self.seed_account(self.page)
        self.choose_outfit()
        self.fill_checkout()
        first = self.page
        second = self.new_page()
        second.goto(BASE)
        self.seed_account(second, 'renter-demo-2')
        self.page = second
        self.choose_outfit()
        self.fill_checkout()
        first.locator('#checkout-confirm').click()
        expect(first).to_have_url(BASE + '#/pesanan')
        second.locator('#checkout-confirm').click()
        expect(second.locator('#checkout-schedule-error')).to_contain_text('sudah dipesan')
        self.assertEqual(self.order_count(), 1)
        expect(second.locator('[name=receiver]')).to_have_value('Nara Demo')

    def test_existing_chat_does_not_mix_demo_accounts(self):
        self.seed_account(self.page)
        self.page.goto(BASE + '#/chat?product=korean')
        self.page.locator('#chatInput').fill('Pesan contoh khusus penyewa pertama')
        self.page.locator('#chatForm [type=submit]').click()
        expect(self.page.locator('#chatMessages')).to_contain_text('Pesan contoh khusus penyewa pertama')
        second = self.new_page()
        second.goto(BASE)
        self.seed_account(second, 'renter-demo-2')
        second.goto(BASE + '#/chat?product=korean')
        expect(second.locator('#chatMessages')).not_to_contain_text('Pesan contoh khusus penyewa pertama')
        owner = self.new_page()
        owner.goto(BASE)
        self.seed_account(owner, 'owner-atelier-luna')
        owner.goto(BASE + '#/chat?product=korean&renter=renter-demo')
        expect(owner.locator('#chatForm')).to_have_count(0)
        self.seed_account(owner, 'owner-lemari-nara')
        expect(owner.locator('#chatMessages')).to_contain_text('Pesan contoh khusus penyewa pertama')
        self.page.goto(BASE + '#/chat?product=korean&renter=renter-demo%3A%3Aother')
        expect(self.page.locator('#chatForm')).to_have_count(0)

    def test_mobile_keyboard_and_reduced_motion(self):
        self.page.set_viewport_size({'width':390,'height':844})
        self.page.emulate_media(reduced_motion='reduce')
        self.page.reload(wait_until='networkidle')
        rail = self.page.locator('.featured-rail')
        rail.focus()
        self.page.keyboard.press('ArrowRight')
        photo_height = self.page.locator('.featured-item.is-active .product-photo').evaluate('el => el.getBoundingClientRect().height')
        self.assertGreater(photo_height, 100)
        transforms = self.page.locator('.featured-item > .product').evaluate_all('els => els.map(el=>getComputedStyle(el).transform)')
        self.assertTrue(all(t == 'none' for t in transforms))
        self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'), 390)
        for width in (320, 390):
            self.page.set_viewport_size({'width':width,'height':844})
            for route in ['#/jelajah','#/outfit/korean','#/outfit/dress','#/outfit/vest','#/outfit/cosplay','#/checkout','#/upload']:
                self.page.goto(BASE + route)
                expect(self.page.locator('main h1')).to_be_visible()
                self.assertLessEqual(self.page.evaluate('document.documentElement.scrollWidth'), width, route)


if __name__ == '__main__':
    unittest.main(verbosity=2)
