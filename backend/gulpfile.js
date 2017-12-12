let gulp = require('gulp');
let plato = require('es6-plato');

let src = './app/**';
let outputDir = './artifacts/plato';


let lintRules = {
  'rules': {
    'indent': [2,'tab'],
    'quotes': [2,'single'],
    'semi': [2,'always'],
    'no-console' : [1],
    'curly': ['error'],
    'no-dupe-keys': 2,
    'func-names': [1, 'always']
  },
  'env': {
    'es6': true
  },
  'globals':['require'],
  'parserOptions' : {
    'sourceType': 'module',
    'ecmaFeatures': {
      'jsx': true,
      'modules': true
    }
  }
};


let complexityRules = {

};

let platoArgs = {
    title: 'example',
    eslint: lintRules,
    complexity: complexityRules
};

function analysis() {
  return plato.inspect(src, outputDir, platoArgs);
}

gulp.task('analysis', analysis);
