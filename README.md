In VS code I recommend [this extension](https://marketplace.visualstudio.com/items?itemName=cezaraugusto.vscode-chrome-extesion-manifest-json-schema)

Typescript with ESM(current standart) will not work in web without Bandler(like Vite).
So it's required to use Bundler. I choosed Vite(the most popular).


`npm install -D @types/chrome`
and change tsconfig.json : `"types": ["chrome"]`


### Init
1. `git clone https://github.com/kaianstack/ts-package-template .`

2. `npx --yes rimraf .git`

3. `cp .env.example .env`

4. Change the name in package.json or `npm pkg set name="package-name"`

5. `npm install`

### How to:
#### Build
`npm run build`
#### Run tests
`npm run test`
#### Start
`npm run start`
#### Add package
`npm install package-name`
for third party packages sometimes for TS you need also install types(also it usually written in package docs or suggested by IDE) using the command that looks like this: `npm install --save-dev @types/package-name`
#### Add your package from github that was built on top of the template:
`npm install github:username/repo`
#### Remove package
`npm uninstall package-name`
If package was installed from github, you need to uninstall it by "name" from package.json.

