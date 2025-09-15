# Broken or flaky demos:

## open
* on-demand-repeat.html
* group-relevance.html
* shared-instances.html (insert behavior when adding to child)
* repeat-attributes-3.html
* repeat-attributes-5.html
* repeat-attributes-8.html (delete not working)
* fx-output markdown should update 
* selects.html - updating improved but still not 100% reliable esp. when countries are selected and continent changes again


* fx-lens does not play with demo-snippet-vanilla yet

## fixed 

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