import { Component, OnInit, AfterViewInit, Input, ViewContainerRef, Inject, ChangeDetectionStrategy, ViewChild, ElementRef} from "@angular/core";

import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";
import { RouterExtensions } from "nativescript-angular/router";
import { getString, setString, hasKey} from "tns-core-modules/application-settings";

import { EventData } from "tns-core-modules/data/observable"; // added for button TODO
import { Button } from "tns-core-modules/ui/button";         // added for submit
import { ListView } from "tns-core-modules/ui/list-view";
import { StackLayout } from "tns-core-modules/ui/layouts/stack-layout";
import { Switch } from "tns-core-modules/ui/switch";

import { Studyform } from './studyform';
import { Studymetadata } from './studymetadata';
import { ListViewResponses } from './listviewresponses';
import { Responseoption } from './responseoption';
import { ItemService } from "./item.service";
import { CacheService } from "./cache.service";
import { device } from "tns-core-modules/platform";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { Observable } from "rxjs/Observable";

import { ModalDialogService} from "nativescript-angular/directives/dialogs";
import { HintComponent } from "./hints.component";
import { UserModel } from './user';
import { LooseObject } from './looseobject';

import { Page } from 'tns-core-modules/ui/page';

interface LooseObject2 {
    [key: string]: any
}

@Component({
    selector: "ns-situation",
    moduleId: module.id,
    templateUrl: "./situation.component.html",
    styleUrls:["./situation-common.css","./situation.css"]
})

export class SituationComponent implements OnInit, AfterViewInit {

    @ViewChild("content") contentView: ElementRef;

    form: Studyform;
    fields: Studymetadata[];
    _fields: Studymetadata[];
    myForm : FormGroup;
    switchValue : LooseObject;
    user : UserModel;


    constructor(private page: Page, private route: ActivatedRoute, private itemService: ItemService, private modal: ModalDialogService, private vcRef: ViewContainerRef, private routerExtensions: RouterExtensions, private cacheService: CacheService) {}

    ngAfterViewInit(): void {
        this.contentView.nativeElement.opacity = 100;
    }

    ngOnInit(): void {
        this.form = JSON.parse(getString("situationForm"));
        this.setUser(); //need to setUser after this.form, but before this.toFormGroup
        this.fields = this.form.fields;
        this.myForm = this.toFormGroup(this.fields);
        this._fields = this.fields;
    }

    setUser(){

         if(hasKey("ActiveUser")){
            this.user = JSON.parse(getString("ActiveUser"));
            var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);
        }else{

            let options = {
                title: "No User!",
                message: "Can not find user in application-settings",
                okButtonText: "OK"
            };
            alert(options);
        }   
    }

    clearPage(){

        for(var i=0; i < this._fields.length; i++ ){

            if(this._fields[i].field_type == 'radio'){
                for(var j=0; j < this._fields[i].select_choices.length; j++){
                    if(this.page.getViewById(this._fields[i].field_name + "_" + this._fields[i].select_choices[j].value) == undefined){
                        continue;
                    }

                    let _StackLayout = <StackLayout>this.page.getViewById(this._fields[i].field_name + "_" + this._fields[i].select_choices[j].value);
                    _StackLayout.backgroundColor = "#edf0f2";

                }
            }

        }

    }

    updateUI(){

        for(var j=0; j < this._fields.length; j++){
            if(this.myForm.value[this._fields[j].field_name] != ""){

                if(this._fields[j].field_type == "radio"){
                    let stack = <StackLayout>this.page.getViewById<StackLayout>(this._fields[j].field_name + "_" + this.myForm.value[this._fields[j].field_name]);
                    stack.backgroundColor ="#30bcff";
                } 

            }
        }
    }


    toFormGroup(questions: Studymetadata[] ) {
        let group: any = {};

        questions.forEach(question => {
            question.field_label = question.field_label.replace("[name]", this.user.name );
            question.select_responses = this.parseResponses(question.field_name, question.select_choices);
            group[question.field_name] = new FormControl(question.field_name);
            group[question.field_name].value = "";
          
            if(question.field_name == "name"){
                group[question.field_name].value ="Enter your name";
            }

        });

        return new FormGroup(group);
    }

    parseResponses(field_name: string, scores:Responseoption[]):ListViewResponses[] {

        var rtn = [];
        for(var i=0; i < scores.length; i++){
            var lvr = new ListViewResponses();
            lvr.field_name = field_name;
            lvr.response_name = scores[i].label.trim().substring(0,scores[i].label.trim().length -1);
            lvr.response_label = scores[i].label.trim().substring(0,scores[i].label.trim().length -1);
            lvr.response_value = parseInt(scores[i].value);
            lvr.answer = "";
            rtn.push(lvr);            
        }
        return rtn;
    }

    saveFormData(data: any){

        var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        var obj: LooseObject2 = {};
        obj.record_id = this.user.record_id;

        for (let key of Object.keys(data)) {
            if(data[key] !=""){
                obj[key] = data[key]; 
                if(data[key] == -1){
                    obj[key] = 0;
                }
            }
        } 
        obj["redcap_repeat_instrument"] = _schedules[0].redcap_repeat_instrument;
        obj["redcap_repeat_instance"] = _schedules[0].redcap_repeat_instance.toString();
        setString("redcap_repeat_instance", obj["redcap_repeat_instance"] );

        //tag each record with an user-defined record-id so data can be pulled with filterLogic.
        obj[this.form.form_name + "_observantid"] = this.user.record_id;
        obj[this.form.form_name + "_date_entered"] = new Date().toLocaleString();

        var myPackage =[];
        myPackage.push(obj);

        this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
            fields => {
                if(fields.count == 1){
                    this.cacheService.removeData(obj,this.form.form_name); 
                }  
            }
        );
    }

    onSelectResponse(args){
 
        for(var i=0; i < args.object.items.length; i++ ){
            let _StackLayout = <StackLayout>this.page.getViewById(args.object.id + "_" + args.object.items[i].response_value);
        }


        var _fields = this.fields.filter(field => field.field_name === args.object.id);
        var responsescore =  _fields[0].select_choices; // Responseoption[]

        this.myForm.value[args.object.id] = responsescore[args.index].value;


        let _controls = this.fields.filter(control => control.field_name === args.object.id);
        _controls[0].answer = responsescore[args.index].value;


        for(var j=0; j < _controls[0].select_responses.length; j++){
            _controls[0].select_responses[j].answer = _controls[0].answer;
        }


        this.fields = this.fields.map(obj => _controls.find(o => o.field_name === obj.field_name) || obj);

        this.contentView.nativeElement.refresh();

        //caching data in case not connected.
        this.cacheService.addData(this.user, this.myForm, this.form.form_name);

    }


    submit(args: EventData){

        this.clearPage();
 
        this.saveFormData(this.myForm.value);

        
        this.routerExtensions.navigate(["/form", getString("redirectForm")], {
        transition: {
            name: "fade",
            duration: 800,
            curve: "linear"
        }
        });
        
        setString("redirectForm", "");

/*
        this.routerExtensions.navigate(["/forms"], {
        transition: {
            name: "fade",
            duration: 800,
            curve: "linear"
        }
        });
*/
    }

}
