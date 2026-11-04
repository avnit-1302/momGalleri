# Publish the memorial without a custom domain

The museum consists entirely of static files. The application needs no server, database, paid API, or payment card. Choose a hosting provider's free tier without paid extras. A hosting account is required. Terms and usage limits may change; the links below lead to the providers' documentation.

## Cloudflare Pages: upload the finished museum

1. Run `npm ci`, `npm test`, and `npm run build` locally.
2. Sign in to Cloudflare and open **Workers & Pages**.
3. Create a Pages project using **Direct Upload / Drag and drop**.
4. Upload `dist` so its `index.html` is at the root of the published files. Do not upload the source tree or `node_modules`.
5. Choose a project name and publish. Share the assigned `pages.dev` address with the family.
6. After editing photographs, rebuild and upload the new `dist` folder as a new production version of the same project.

Cloudflare documents [Direct Upload](https://developers.cloudflare.com/pages/get-started/direct-upload/) and [free-plan limits](https://developers.cloudflare.com/pages/platform/limits/). Individual files, including videos, must stay below 25 MiB. A Direct Upload project cannot later switch to Git integration within that same Pages project.

## Vercel: deploy from GitHub

1. Put the finished source in your GitHub repository. Git already ignores `node_modules`, `dist`, and test screenshots.
2. Create a Vercel **Hobby** project and import the repository.
3. Choose **Vite**, build command `npm run build`, install command `npm ci`, and output directory `dist`.
4. Select Node.js 22 or later. No environment variables are needed.
5. Publish and share the assigned `vercel.app` address.

[Vercel's Hobby plan](https://vercel.com/docs/plans/hobby) is intended for personal projects and includes free usage. See [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite) for configuration details.

## Netlify: upload `dist` or connect GitHub

Run `npm run build`, then use Netlify's manual upload to deploy `dist`. Alternatively, import the repository with build command `npm run build` and publish directory `dist`. The included `netlify.toml` declares these settings. Choose the free plan and use the included `netlify.app` address.

See [Netlify's deployment guide](https://docs.netlify.com/deploy/create-deploys/) and [current plans](https://www.netlify.com/pricing/). This project needs no Functions, forms, database, or other add-ons.

## Taking the memorial offline

There is no built-in expiry date. The museum remains available until you take it down, whether after two weeks or at another time chosen by the family. Keep a local copy of the source and photographs. Open the hosting project's settings to delete or unpublish it. Check the project name before deletion, and remove separate preview deployments if the provider retains them. The local project does not need to be deleted.

A normal static deployment is accessible to anyone with its address; the application has no sign-in. Choose the photographs the family wishes to share. A private GitHub repository does not automatically make the published site private.

## Before sharing

- Replace the portrait and desired photographs, setting `placeholder: false` for real images.
- Review all six rooms, personal memories, and dates.
- Keep the wording consistent with a memorial to the late Puja Anand.
- Try the museum on a computer and a phone, including any videos.
- Share the published address, not `localhost`.

No custom domain purchase or changes to the 3D code are needed for these hosting methods.
