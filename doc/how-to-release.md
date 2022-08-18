# how to release step-by-step

1. `git status` must report 'working tree clean' to continue
2. `npm pack` to create archive
3. move resulting tgz to tmp folder and unpack
4. check if content is as expected
5. `np --branch dev --no-release-draft` start interactive np tool
6. step through np and select appropriate release numbering
7. push tags
8. goto github and write release notes