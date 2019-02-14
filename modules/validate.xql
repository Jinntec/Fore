xquery version "3.1";
import module namespace modelValidator="http://exist-db.org/apps/model-validator" at "modelValidator.xqm";

let $model :=
<exf-model id="address">

    <exf-instance>
        <data>
            <salary>110</salary>
            <average>120.00</average>
        </data>
    </exf-instance>

    <exf-bind ref="//salary">
        <calculate>
        <exf-required>
            <!-- 'target attr könnte benutzt werden um eine message an ein UI-control per id zu binden. Dies
            setzt Wissen des Entwicklers voraus und ist eher eine pragmatische Lösung -->
            <exf-alert target="firstname">salary is required</exf-alert>
        </exf-required>
        <exf-type type="xs:decimal">
            <exf-alert>salary is not a decimal</exf-alert>
        </exf-type>
        <exf-constraint expr=". gt ../average">
            <exf-alert>salary is not too low</exf-alert>
        </exf-constraint>
    </exf-bind>

</exf-model>

return modelValidator:validate($model)
