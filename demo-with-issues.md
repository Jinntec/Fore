# Broken or flaky demos:

## open
* shared-instances.html (insert behavior when adding to child)
* repeat-attributes-3.html (delete index still not always right - should go to item after deleted one if any otherwise last)
* repeat-attributes-5.html
* dataref (skipped) tests not working except the first - already tried everything but not luck

* fx-lens does not play with demo-snippet-vanilla yet

## fixed
### selects.html - updating silly error in demo using 'australia' instead of 'australasia'

### fx-output markdown should update
has an explicit refresh to outputting md but seems acceptable for now

### on-demand-repeat.html
### group-relevance.html

### i18n2.html

fixed and tested
Resolution:
submission replace instance fires explicit hard refresh (see reset)

### reset.html
Resolution:

does hard refresh now but is justified here (might still have some potential considering the target instance of the reset)

### fx-replace.html

Resolution:
- does a hard refresh for now and remains an area of work

### create-nodes/multi-step.html

properly creates modelitems in repeat but revealed an issue in create-nodes itself creating unwanted parent element
-> TaxCategory

delete does not cleanup child modelitems
