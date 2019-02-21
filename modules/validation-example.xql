xquery version "3.1";
import module namespace fore="http://exist-db.org/apps/fore" at "fore.xqm";


let $model :=
<xf-model id="address">

    <xf-instance src="{fore:params2Instance()}">
<!-- resulting instance for params 'salary=120.00' and 'average=100.00'
        <data>
            <salary>120.00</salary>
            <average>100.00</average>
        </data>
-->
    </xf-instance>

    <xf-bind ref="salary">
        <xf-required>
            <xf-alert>salary is required</xf-alert>
        </xf-required>
        <xf-type type="xs:decimal">
            <xf-alert>salary is not a decimal</xf-alert>
        </xf-type>
        <xf-constraint expr=". lt ../average">
            <xf-alert>salary is not too low</xf-alert>
        </xf-constraint>
    </xf-bind>

    <xf-bind type="xs:decimal">
        <xf-alert>average is not a decimal</xf-alert>
    </xf-bind>
</xf-model>

return fore:init($model) => fore:validate()
