
```
saas-video-ecommerce
├─ backend
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ server.ts
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  └─ database.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ services
│  │  ├─ types
│  │  │  ├─ auth.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  └─ utils
│  │     ├─ jwt.util.ts
│  │     ├─ response.util.ts
│  │     └─ validation.schemas.ts
│  └─ tsconfig.json
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
│  │  │  ├─ forms
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  └─ VideoForm.tsx
│  │  │  ├─ theme-toggle.tsx
│  │  │  └─ ui
│  │  │     ├─ Button.tsx
│  │  │     ├─ Card.tsx
│  │  │     ├─ Dialog.tsx
│  │  │     ├─ Dropdown-menu.tsx
│  │  │     ├─ Input.tsx
│  │  │     └─ Modal.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
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
│  │  │  │  └─ Dashboard.tsx
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
```
saas-video-ecommerce
├─ backend
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  └─ database.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ server.ts
│  │  ├─ types
│  │  │  ├─ auth.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  └─ utils
│  │     ├─ jwt.util.ts
│  │     ├─ response.util.ts
│  │     └─ validation.schemas.ts
│  └─ tsconfig.json
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
│  │  │  ├─ forms
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  └─ VideoForm.tsx
│  │  │  ├─ theme-toggle.tsx
│  │  │  └─ ui
│  │  │     ├─ Button.tsx
│  │  │     ├─ Card.tsx
│  │  │     ├─ Dialog.tsx
│  │  │     ├─ Dropdown-menu.tsx
│  │  │     ├─ Input.tsx
│  │  │     └─ Modal.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
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
│  │  │  │  └─ Dashboard.tsx
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
├─ README.md
├─ shared
│  ├─ types
│  └─ utils
└─ vercel.json

```
```
saas-video-ecommerce
├─ backend
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  └─ database.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ test.controller.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ logger.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ index.ts
│  │  │  ├─ Subscription.model.ts
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  └─ auth.service.ts
│  │  ├─ types
│  │  │  ├─ auth.types.ts
│  │  │  ├─ models.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  └─ utils
│  │     ├─ jwt.util.ts
│  │     ├─ response.util.ts
│  │     └─ validation.schemas.ts
│  ├─ test-api.sh
│  └─ tsconfig.json
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
│  │  │  ├─ dashboard
│  │  │  │  ├─ RecentVideos.tsx
│  │  │  │  ├─ StatsCard.tsx
│  │  │  │  └─ UsageChart.tsx
│  │  │  ├─ forms
│  │  │  │  ├─ LoginForm.tsx
│  │  │  │  └─ VideoForm.tsx
│  │  │  ├─ theme-toggle.tsx
│  │  │  └─ ui
│  │  │     ├─ Badge.tsx
│  │  │     ├─ Button.tsx
│  │  │     ├─ Card.tsx
│  │  │     ├─ Dialog.tsx
│  │  │     ├─ Dropdown-menu.tsx
│  │  │     ├─ Input.tsx
│  │  │     └─ Modal.tsx
│  │  ├─ contexts
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useStats.ts
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
├─ README.md
├─ shared
│  ├─ types
│  └─ utils
└─ vercel.json

```
```
saas-video-ecommerce
├─ backend
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  └─ database.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ credits.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ test.controller.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ logger.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ CreditTransaction.model.ts
│  │  │  ├─ index.ts
│  │  │  ├─ Subscription.model.ts
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ auth.service.ts
│  │  │  └─ credits.service.ts
│  │  ├─ types
│  │  │  ├─ auth.types.ts
│  │  │  ├─ credit.types.ts
│  │  │  ├─ models.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  └─ utils
│  │     ├─ jwt.util.ts
│  │     ├─ response.util.ts
│  │     └─ validation.schemas.ts
│  ├─ test-api.sh
│  ├─ test-credits-api.sh
│  └─ tsconfig.json
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
│  │  │  └─ ui
│  │  │     ├─ Badge.tsx
│  │  │     ├─ Button.tsx
│  │  │     ├─ Card.tsx
│  │  │     ├─ Dialog.tsx
│  │  │     ├─ Dropdown-menu.tsx
│  │  │     ├─ Input.tsx
│  │  │     └─ Modal.tsx
│  │  ├─ contexts
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useCredits.ts
│  │  │  ├─ useStats.ts
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
├─ README.md
├─ shared
│  ├─ types
│  └─ utils
└─ vercel.json

```
```
saas-video-ecommerce
├─ backend
│  ├─ nodemon.json
│  ├─ package-lock.json
│  ├─ package.json
│  ├─ src
│  │  ├─ app.ts
│  │  ├─ config
│  │  │  └─ database.config.ts
│  │  ├─ controllers
│  │  │  ├─ auth.controller.ts
│  │  │  ├─ credits.controller.ts
│  │  │  ├─ generate.controller.ts
│  │  │  ├─ generate.service.ts
│  │  │  ├─ test.controller.ts
│  │  │  ├─ users.controller.ts
│  │  │  └─ videos.controller.ts
│  │  ├─ index.ts
│  │  ├─ middleware
│  │  │  ├─ auth.middleware.ts
│  │  │  ├─ cors.middleware.ts
│  │  │  ├─ error.middleware.ts
│  │  │  ├─ logger.middleware.ts
│  │  │  ├─ rateLimit.middleware.ts
│  │  │  └─ validation.middleware.ts
│  │  ├─ models
│  │  │  ├─ CreditTransaction.model.ts
│  │  │  ├─ index.ts
│  │  │  ├─ Subscription.model.ts
│  │  │  ├─ User.model.ts
│  │  │  └─ Video.model.ts
│  │  ├─ server.ts
│  │  ├─ services
│  │  │  ├─ auth.service.ts
│  │  │  └─ credits.service.ts
│  │  ├─ types
│  │  │  ├─ auth.types.ts
│  │  │  ├─ credit.types.ts
│  │  │  ├─ models.types.ts
│  │  │  ├─ user.types.ts
│  │  │  └─ video.types.ts
│  │  └─ utils
│  │     ├─ jwt.util.ts
│  │     ├─ response.util.ts
│  │     └─ validation.schemas.ts
│  ├─ test-api.sh
│  ├─ test-credits-api.sh
│  └─ tsconfig.json
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
│  │  │  └─ ui
│  │  │     ├─ Badge.tsx
│  │  │     ├─ Button.tsx
│  │  │     ├─ Card.tsx
│  │  │     ├─ Dialog.tsx
│  │  │     ├─ Dropdown-menu.tsx
│  │  │     ├─ Input.tsx
│  │  │     └─ Modal.tsx
│  │  ├─ contexts
│  │  │  └─ AuthContext.tsx
│  │  ├─ hooks
│  │  │  ├─ useApi.ts
│  │  │  ├─ useAuth.ts
│  │  │  ├─ useCredits.ts
│  │  │  ├─ useStats.ts
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
├─ README.md
├─ shared
│  ├─ types
│  └─ utils
└─ vercel.json

```