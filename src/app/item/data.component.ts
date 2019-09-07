import { Component, OnInit, Input, Inject} from "@angular/core";

import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import { Studyform } from './studyform';
import { ItemService } from "./item.service";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { Observable } from "rxjs/Observable";
import { DataStructure } from './datastructure';
import { UserModel } from './user';
import { LooseObject } from './looseobject';


@Component({
    selector: "ns-data",
    moduleId: module.id,
    templateUrl: "./data.component.html",
    styleUrls:["./data.css"]
})


export class DataComponent implements OnInit {

    data: DataStructure[];
    user : UserModel;
    forms: Array<Studyform> = [];

    constructor(private itemService: ItemService) { }

    ngOnInit(): void {

        if(hasKey("ActiveUser")){
           this.user = JSON.parse(getString("ActiveUser"));
        }

        if(hasKey("studyForms")){
            this.forms = JSON.parse(getString("studyForms"));
        }

        this.getData();
    }

    getUserFormData(form_name: string): void {
        console.log("adding data from " + form_name);
    }


    getData(): void {

        this.data = [];

        for(var i=0; i < this.forms.length; i++){

        this.itemService.getUserData(this.user, this.forms[i].form_name).subscribe(
            fields =>{

               fields.forEach(assessmentform => {
                    
                    var assessment = new DataStructure();
                    assessment.results = [];
                    assessment.record_id = assessmentform.record_id;
                    assessment.redcap_repeat_instance = assessmentform.redcap_repeat_instance;
                    assessment.redcap_repeat_instrument = assessmentform.redcap_repeat_instrument;

                    
                    for (let key of Object.keys(assessmentform)) {
                        var obj = new LooseObject;
                        obj.key = key;
                        obj.value = assessmentform[key];

                        if(key !="observantid" && key !="record_id" && key !="redcap_repeat_instance" && key !="redcap_repeat_instrument")
                        assessment.results.push(obj); 
                    } 

                    this.data.push(assessment)
                });

            }
        )

        }

    }

}
