xquery version "3.1";


let $form := session:get-attribute('form')

let $data := request:get-data()

return $data
