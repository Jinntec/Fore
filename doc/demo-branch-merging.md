# Differences between 'demo' and 'dev' branch to consider

'demo' branch has some important differences to 'dev':

That means that some of these differences need to be preserved
while all other content of 'demo' should be overwritten in 'demo':

* rollup.config.js - demo has its own build for deployment on github pages
* demo/demo.js - load the demo dist
* demo/demo-build.js - needed by rollup to create demo build

> need to run `git config --global merge.ours.driver true` once