# React Project Starter

## Config files
* .eslintrc
* .prettierrc
* .gitignore
* .babelrc

## package.json
### Dev dependencies
* babel-eslint
* eslint
* eslint-config-airbnb
* eslint-config-prettier
* eslint-import-resolver-alias
* eslint-plugin-import
* eslint-plugin-jsx-a11y
* eslint-plugin-react
* lint-staged
* prettier
* remote-redux-devtools

### Dependencies
#### Type checking
* prop-types
#### CSS
* styled-components
#### Api
* axios
#### Data
* redux
* react-redux
* redux-actions
* redux-create-reducer
* redux-saga
* reselect
#### Forms
* formik
* yup
#### Date
* date-fns

### scripts
```
"scripts": {
  "precommit": "lint-staged",
  "prettier": "prettier --log-level=debug --list-different src/**/*.{js,jsx,json,css,scss}",
  "lint": "eslint --ignore-path .gitignore --color ./**/*.{js,jsx}"
},
"lint-staged": {
  "src/**/*.{js,jsx,css,scss}": [
    "npm run prettier",
    "npm run lint"
  ]
}
```

## Folder tree
```
- index.js
- assets
  - images
  - fonts
- src
  - components
  - constants
  - routes
  - services
  - styles
  - utils
``` 
