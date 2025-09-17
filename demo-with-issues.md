# Broken or flaky demos:

## open
* shared-instances.html (insert behavior when adding to child)
* repeat-attributes-3.html
* repeat-attributes-5.html
* repeat-attributes-8.html (delete not working)
* selects.html - updating improved but still not 100% reliable esp. when countries are selected and continent changes again


* fx-lens does not play with demo-snippet-vanilla yet

## fixed 
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