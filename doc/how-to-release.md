# how to release step-by-step

## Release
1. `npm version patch | minor | major` depending on the nature of the changes in this release
1. `git push` to push the generated commit
1. `git push --tags` to push the generated tag
1. `npm publish`
1. goto github and write release notes
1. merge dev to master

## updating demo site

Release should be done before merge into demo to update the version number correctly.

1. merge dev into demo branch. 'demo' branch has git attributes to prevent important files to be overwritten.
2. eventually update demo.js if third-party deps have changed
3. update demo build and push

Fore homepage and online demos will be published then automatically
via github pages.


