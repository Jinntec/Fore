# manual conversions needed

## fx-select -> fx-control

e.g. 
```
 <fx-select class="tp-input" ref="//gramGrp[@type='classification']/gram[@type='GPR']" appearance="full">
    <fx-itemset nodeset="instance('i-gpr')//option">
        <fx-label ref="."/>
        <fx-value ref="."/>
    </fx-itemset>
</fx-select>
```

needs to be
```
<fx-control class="tp-input"  ref="//gramGrp[@type='classification']/gram[@type='fictitious']"  update-event="change">
    <select ref="instance('i-fictitious')/option" class="widget">
        <template>
            <option value="{.}">{.}</option>
        </template>
    </select>
</fx-control>

```

## functionality

* dialog component still missing in Fore and needed here
* fx-hint - implementation