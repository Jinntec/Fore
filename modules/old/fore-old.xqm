xquery version "3.1";

module namespace fore="http://exist-db.org/apps/fore";

(: inits the whole form :)
declare function fore:init($form as element(), $params as map){

    (: support multiple models? :)
    (: init model :)
    fore:init-model($form/fore-model[1])
};

(: update model with data from client including error messaging :)
declare function fore:update($fore as JSON){

};

(: trigger an action on the server :)
declare function fore:dispatch($action as xs:string){

};

(: free all internal state :)
declare function fore:shutdown(){

};

(: this is here to nag us as it implies explicit state keeping... :)
declare private function fore:reset($form as element){

};

(: private stuff :)
(:
    todo: question: how do we handle xforms schema simple types? Do we need to import the Schema and how?
:)
declare function fore:init-model($model as element){

    (:
    it's the question of how much state we actually initially want or need.
    As a consequence it might well be a start to ignore explicit loading of
    instances and just evaluate those when request by recalc or reval.

    This would also make 'rebuild' unnecessary for the moment
    :)
    fore:load-instances($model),
    fore:rebuild($model),
    fore:recalculate($model),
    fore:revalidate($model),
    fore:ready($model),
    fore:refresh($model)

};

declare private function fore:load-instances($instances as element*){
};


(: this one is optional at least until we're doing a dependency graph :)
declare private function fore:rebuild($model as element){
};

(: iterate and evaluate all 'calculate' attributes on bind elements :)
declare private function fore:recalculate($model as element){

    (:
    iterate all binds and evaluate 'bind' attribute or fore-bind/@ex
    :)


};


declare private function fore:revalidate($model as element){

};


(:
    return the state of all relevant nodes to the client as some JSON structure.

    Along this lines....
    {
        "data":{
            "id": [node-number or other unique id to address a given instance node],
            "value": [value of the node if any],
            "readonly": [boolean flag reflecting the readonly state (false by default),
            "required": [boolean flag reflecting the required state (false by default),
            "relevant": it's debatable if non-relevant nodes are passed at all and therefore if this property is needed at all,
            "valid": [boolean flag reflecting valid state (true by default)
        },
        "actions":{
            "alert": {
                "id": [aBindId],
                "message":[the message taken from bind element]
            },
            "message": [a message],
            "load": [a uri to load]
        }

    }

:)
declare private function fore:refresh($model as element){

};

(:~
    generates an XML instance from request params. 'data' will be used as the rootnode name.
:)
declare function fore:param2instance(){
    <data>
    {
        for $param in request:get-parameters()
            (: todo :)
            return ()
    }
    </data>
};
