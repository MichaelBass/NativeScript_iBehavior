import { Component, OnInit, AfterViewInit, Input, ViewContainerRef, Inject, ChangeDetectionStrategy, ViewChild, ElementRef} from "@angular/core";
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from "@angular/router";

import { RouterExtensions, ModalDialogService } from "@nativescript/angular";
import { ApplicationSettings, Page, EventData, Button, StackLayout } from '@nativescript/core';
import * as dialogs from '@nativescript/core/ui/dialogs';

import { Studyform } from '../model/studyform';
import { Studymetadata } from '../model/studymetadata';
import { ListViewResponses } from '../model/listviewresponses';
import { Responseoption } from '../model/responseoption';
import { UserModel } from '../model/user';
import { LooseObject } from '../model/looseobject';

import { ItemService } from "../server/item.service";
import { CacheService } from "../server/cache.service";

import { Observable} from "rxjs";


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

    @ViewChild("content", { static: false }) contentView: ElementRef;

    form: Studyform;
    fields: Studymetadata[];
    _fields: Studymetadata[];
    myForm : FormGroup;
    switchValue : LooseObject;
    user : UserModel;

    position: number;
    page_size: number;
    end:number;
    isWarned: boolean = false;

    constructor(private page: Page, private route: ActivatedRoute, private itemService: ItemService, private modal: ModalDialogService, private vcRef: ViewContainerRef, private routerExtensions: RouterExtensions, private cacheService: CacheService) {
        this.page_size = 1;
    }

    ngAfterViewInit(): void {
        //this.contentView.nativeElement.opacity = 100;  
    }

    setNavigation(){
        let prev = <Button>this.page.getViewById('prev');
        if(this.position <= 0){
            prev.isEnabled = false;
        } else {
            prev.isEnabled = true;
        }
    }

    ngOnInit(): void {
        this.form = JSON.parse(ApplicationSettings.getString("situationForm"));
        this.setUser(); //need to setUser after this.form, but before this.toFormGroup
        this.fields = this.form.fields;
        this.myForm = this.toFormGroup(this.fields);
        this._fields = this.fields;

        this.position = 0;

        this.paginate(this.position);

        this.page.on('navigatingFrom', (data) => {
            let Leave_options = {
                title: "Leaving Page!",
                message: "You are about to leave the page, your data will not be saved.",
                okButtonText: "OK"
            };
            alert(Leave_options);
            // run destroy code
            // (note: this will run when you either move forward to a new page or back to the previous page)
        })
    }

    setUser(){

         if(ApplicationSettings.hasKey("ActiveUser")){
            this.user = JSON.parse(ApplicationSettings.getString("ActiveUser"));
            let _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);
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
                    //_StackLayout.backgroundColor = "#edf0f2";

                }
            }

        }

    }

    updateUI(){

        for(var j=0; j < this._fields.length; j++){
            if(this.myForm.value[this._fields[j].field_name] != ""){

                if(this._fields[j].field_type == "radio"){
                    let stack = <StackLayout>this.page.getViewById<StackLayout>(this._fields[j].field_name + "_" + this.myForm.value[this._fields[j].field_name]);
                    //stack.backgroundColor ="#30bcff";
                } 

            }
        }
    }

    paginate(_position: number){
        this.position = _position;
        this.end = this.position + this.page_size;
        this._fields = this.fields.slice(this.position, this.end);
 
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
            let lvr = new ListViewResponses();
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

        let _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        let obj: LooseObject2 = {};
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
        ApplicationSettings.setString("redcap_repeat_instance", obj["redcap_repeat_instance"] );

        //tag each record with an user-defined record-id so data can be pulled with filterLogic.
        obj[this.form.form_name + "_observantid"] = this.user.record_id;
        obj[this.form.form_name + "_date_entered"] = new Date().toLocaleString();

        let myPackage =[];
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


        let _fields = this.fields.filter(field => field.field_name === args.object.id);
        let responsescore =  _fields[0].select_choices; // Responseoption[]

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

    previous (args: EventData){

        this.clearPage();

        if(this.position - this.page_size >= 0){
            this.position = this.position - this.page_size;
        }

        this.paginate(this.position);
        this.setNavigation();
        
    }

    validateData(){

        if( this.myForm.value[this._fields[0].field_name] == -1 ){
            this.processData();
            return;
        }

        let count = 0;
        for(var j=0; j < this._fields.length; j++){
            var value = this.myForm.value[ this._fields[j].field_name ];
            if(value){
                count = count + 1;
            }
        }

        if(this._fields.length != count){        
            dialogs.alert({
            title: "Missing Data",
            message: "Question(s) has not been answered.",
            okButtonText: "Close"
            }).then(r => {  this.isWarned = true; });
        } else{
            this.processData();
        }

        //this.processData();
    }

    processData(){

        this.clearPage();

        this.position = this.end;

        // skip the follow-up question if observation time is ok.
        if(this._fields[0].field_name == 'able_observed' && this.myForm.value[ this._fields[0].field_name ] == 1){
            this.position = this.end + 1;
        }

        // skip the follow-up question is answered go home.
        if(this._fields[0].field_name == 'reason_not_observed' ){

            this.saveFormData(this.myForm.value);

            this.routerExtensions.navigate(["/splashscreen"], {
            transition: {
                name: "fade",
                duration: 800,
                curve: "linear"
            }
            });
        }


        if(this.position >= this.fields.length){

            this.saveFormData(this.myForm.value);

            this.routerExtensions.navigate(["/form", ApplicationSettings.getString("redirectForm")], {
            transition: {
                name: "fade",
                duration: 800,
                curve: "linear"
            }
            });

            ApplicationSettings.setString("redirectForm", "");

        }else{       
            this.paginate(this.position);
            this.setNavigation();
        }

    }


    submit(args: EventData){

        this.validateData();
    
    }

    submit_old(args: EventData){

        this.clearPage();
 
        this.saveFormData(this.myForm.value);

        
        this.routerExtensions.navigate(["/form", ApplicationSettings.getString("redirectForm")], {
        transition: {
            name: "fade",
            duration: 800,
            curve: "linear"
        }
        });
        
        ApplicationSettings.setString("redirectForm", "");

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
