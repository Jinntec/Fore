# how to release step-by-step

## Prerequisites
1. merge dev into demo branch. 'demo' branch has git attributes to prevent important files to be overwritten. 
2. eventually update demo.js if third-party deps have changed
3. update demo build and push

Fore homepage and online demos will be published then automatically
via github pages.

Before moving on demo site should be checked.

## Release
1. `git status` must report 'working tree clean' to continue
2. `npm pack` to create archive
3. move resulting tgz to tmp folder and unpack
4. check if content is as expected
5. `np --branch dev --no-release-draft` start interactive np tool
6. step through np and select appropriate release numbering
7. push tags
8. goto github and write release notes
9. merge dev to master