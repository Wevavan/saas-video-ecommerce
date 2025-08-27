
```
saas-video-ecommerce
├─ backend
│  ├─ integrate-logging-performance.sh
│  ├─ jest.config.json
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  ├─ database.config.ts
│  │  │  ├─ logger.config.ts
│  │  │  └─ redis.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ credits.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ runway.controller.ts
│  │  │  ├─ test.controller.ts
│  │  │  ├─ upload.controller.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ logger.middleware.ts
│  │  │  ├─ performance.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ CreditTransaction.model.ts
│  │  │  ├─ Image.model.ts
│  │  │  ├─ index.ts
│  │  │  ├─ Subscription.model.ts
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ auth.service.ts
│  │  │  ├─ cache.service.ts
│  │  │  ├─ cleanup.service.ts
│  │  │  ├─ credits.service.ts
│  │  │  ├─ elevenlabs.service.ts
│  │  │  ├─ imageOptimization.service.ts
│  │  │  ├─ openai.service.ts
│  │  │  ├─ queue.service.ts
│  │  │  ├─ runway.monitoring.service.ts
│  │  │  ├─ runway.polling.service.ts
│  │  │  ├─ runway.service.ts
│  │  │  └─ videoAssembly.service.ts
│  │  ├─ types
│  │  │  ├─ audio
│  │  │  │  └─ elevenlabs.types.ts
│  │  │  ├─ auth.types.ts
│  │  │  ├─ credit.types.ts
│  │  │  ├─ index.ts
│  │  │  ├─ models.types.ts
│  │  │  ├─ queue.types.ts
│  │  │  ├─ runway.types.ts
│  │  │  ├─ upload.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  ├─ utils
│  │  │  ├─ jwt.util.ts
│  │  │  ├─ response.util.ts
│  │  │  └─ validation.schemas.ts
│  │  └─ workers
│  │     └─ videoGeneration.worker.ts
│  ├─ test-api.sh
│  ├─ test-credits-api.sh
│  ├─ test-elevenlabs.sh
│  ├─ test-first-video.sh
│  ├─ test-image.jpg
│  ├─ test-redis-upstash.js
│  ├─ test-runway-direct.sh
│  ├─ test-runway-simple.sh
│  ├─ test-simple.sh
│  ├─ test-upload-api.sh
│  ├─ test_audio.mp3
│  ├─ tsconfig.json
│  ├─ uploads
│  │  ├─ 00f60741-ee57-4074-86b8-25629c08d1a3_test-image.jpg
│  │  ├─ 055377f2-613a-4d2f-9fcc-2d951702866d_test_product.png
│  │  ├─ 14abf81b-2886-496e-945b-e0b42e43e4ac_cadre-bordure-vintage_481866-7028-3867679950.jpg
│  │  ├─ 1c3cec17-14cd-4fc4-91a7-f6436e5d5136_test_product.png
│  │  ├─ 1e9c5073-11ee-4cb9-a15b-564c2aa9e289_logo-estiam-rvb-775500605.jpg
│  │  ├─ 30d770b1-c818-4829-bc41-3bacc2e5ef46_grey_and_black_simple_minimalist_real_estate_logo.png
│  │  ├─ 55628f66-670a-4610-b82e-4dff95c45d41_test_product.png
│  │  ├─ 5d6b43a7-99c0-4a53-9824-6cfbc2ed7af2_test_product.png
│  │  ├─ 63a6dd19-22c6-4414-a7b6-c453c448a0eb_test_product.png
│  │  ├─ 6a44681d-3b6b-4d1e-a4ee-53c69806f80f_jjj.png
│  │  ├─ 85582362-a290-4697-aa4a-16a751339bbe_grey_and_black_simple_minimalist_real_estate_logo.png
│  │  ├─ 8a315da1-bdbd-4bae-b64d-586c9a1936f1_test_product.png
│  │  ├─ 9ad39201-f97f-4739-be64-59f72c70de71_test_product.png
│  │  ├─ a58d6868-391f-4e0c-909a-7d0e4b0fea82_test_product.png
│  │  ├─ a7b14c00-27b9-4262-b855-8f8a05c3e18a_grey_and_black_simple_minimalist_real_estate_logo.png
│  │  ├─ audio
│  │  ├─ b470d124-df86-4927-8d9c-190fb0ef0c1d_test_product.png
│  │  ├─ e07c1545-93d5-45ce-906b-c563ff55b214_test_product.png
│  │  ├─ e8d57a19-295a-43ec-ba17-28a9280f6f82_logo-estiam-rvb-775500605.jpg
│  │  └─ fd71e6d7-a851-49a2-9b98-781489c3d75d_test_product.png
│  └─ yarn.lock
├─ docs
│  ├─ API.md
│  └─ README.md
├─ frontend
│  ├─ .eslintrc.js
│  ├─ .prettierrc
│  ├─ eslint.config.js
│  ├─ index.html
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ postcss.config.js
│  ├─ public
│  │  ├─ favicon.ico
│  │  └─ vite.svg
│  ├─ README.md
│  ├─ restructure.sh
│  ├─ src
│  │  ├─ App.tsx
│  │  ├─ assets
│  │  │  └─ react.svg
│  │  ├─ components
│  │  │  ├─ auth
│  │  │  ├─ credits
│  │  │  │  ├─ BuyCreditsModal.tsx
│  │  │  │  ├─ CreditCounter.tsx
│  │  │  │  ├─ CreditHistory.tsx
│  │  │  │  └─ CreditUsageChart.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ RecentVideos.tsx
│  │  │  │  ├─ StatsCard.tsx
│  │  │  │  └─ UsageChart.tsx
│  │  │  ├─ forms
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  └─ VideoForm.tsx
│  │  │  ├─ theme-toggle.tsx
│  │  │  ├─ ui
│  │  │  │  ├─ Badge.tsx
│  │  │  │  ├─ Button.tsx
│  │  │  │  ├─ Card.tsx
│  │  │  │  ├─ Dialog.tsx
│  │  │  │  ├─ Dropdown-menu.tsx
│  │  │  │  ├─ Input.tsx
│  │  │  │  └─ Modal.tsx
│  │  │  └─ upload
│  │  │     ├─ ImageGallery.tsx
│  │  │     ├─ ImageModalHandler.tsx
│  │  │     ├─ ImagePreview.tsx
│  │  │     ├─ ImageUpload.tsx
│  │  │     └─ index.ts
│  │  ├─ contexts
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useCredits.ts
│  │  │  ├─ useCreditUsage .ts
│  │  │  ├─ useImages.ts
│  │  │  ├─ useStats.ts
│  │  │  ├─ useUpload.ts
│  │  │  └─ useVideo.ts
│  │  ├─ index.css
│  │  ├─ lib
│  │  │  ├─ theme.ts
│  │  │  └─ utils.ts
│  │  ├─ main.tsx
│  │  ├─ pages
│  │  │  ├─ auth
│  │  │  │  ├─ Login.tsx
│  │  │  │  └─ Register.tsx
│  │  │  ├─ dashboard
│  │  │  │  ├─ Analytics.tsx
│  │  │  │  ├─ Credits.tsx
│  │  │  │  ├─ Generate.tsx
│  │  │  │  ├─ Overview.tsx
│  │  │  │  ├─ Settings.tsx
│  │  │  │  └─ Videos.tsx
│  │  │  ├─ settings
│  │  │  │  ├─ Billing.tsx
│  │  │  │  └─ Profile.tsx
│  │  │  └─ videos
│  │  │     ├─ VideoEditor.tsx
│  │  │     ├─ VideoList.tsx
│  │  │     └─ VideoPreview.tsx
│  │  ├─ services
│  │  │  ├─ api.ts
│  │  │  ├─ auth.service.ts
│  │  │  ├─ credits.service.ts
│  │  │  ├─ upload.service.ts
│  │  │  └─ video.service.ts
│  │  ├─ store
│  │  │  ├─ authSlice.ts
│  │  │  ├─ store.ts
│  │  │  └─ videoSlice.ts
│  │  ├─ styles
│  │  │  ├─ components.css
│  │  │  └─ globals.css
│  │  ├─ types
│  │  │  ├─ api.types.ts
│  │  │  ├─ auth.types.ts
│  │  │  ├─ credits.types.ts
│  │  │  ├─ upload.types.ts
│  │  │  └─ video.types.ts
│  │  ├─ utils
│  │  │  ├─ constants.ts
│  │  │  ├─ helpers.ts
│  │  │  └─ validation.ts
│  │  └─ vite-env.d.ts
│  ├─ tailwind.config.js
│  ├─ tsconfig.app.json
│  ├─ tsconfig.json
│  ├─ tsconfig.node.json
│  ├─ vite.config.ts
│  └─ yarn.lock
├─ LICENSE
├─ shared
│  ├─ types
│  └─ utils
└─ vercel.json

```