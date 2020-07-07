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
import { device, isAndroid, isIOS } from "tns-core-modules/platform";
import { ObservableArray } from "tns-core-modules/data/observable-array";
import { Observable } from "rxjs/Observable";

import { ModalDialogService} from "nativescript-angular/directives/dialogs";
import { HintComponent } from "./hints.component";

// import { Store } from 'redux';
// import { AppStore } from '../app.store';
// import { AppState } from '../app.state';
//import * as UserActions from '../user.actions';

import { UserModel } from './user';
import { LooseObject } from './looseobject';

import { Page } from 'tns-core-modules/ui/page';
import * as dialogs from "tns-core-modules/ui/dialogs";

interface LooseObject2 {
    [key: string]: any
}

@Component({
    selector: "ns-details",
    moduleId: module.id,
    templateUrl: "./item-detail2.component.html",
    styleUrls:["./item-detail-common.css", "./item-detail.css"]
})

export class ItemDetail2Component implements OnInit, AfterViewInit {

    @ViewChild("content", { static: false }) contentView: ElementRef;

    form: Studyform;
    fields: Studymetadata[];
    _fields: Studymetadata[];

    forms: Studyform[];

    hint: LooseObject2;
    myForm : FormGroup;

    switchValue : LooseObject;

    user : UserModel;
    position: number;
    page_size: number;
    end:number;

    platform: string;

    administeredItems: number[];

    isWarned: boolean = false;

    constructor(private page: Page, private route: ActivatedRoute, private itemService: ItemService, private modal: ModalDialogService, private vcRef: ViewContainerRef, private routerExtensions: RouterExtensions, private cacheService: CacheService) { 
        this.page_size = 3;
        this.hint = {};
        this.page.actionBarHidden = true;

        if (isAndroid) {
            this.platform ="Android";
        } else if (isIOS) {
            this.platform ="iOS";
        }

    }

    ngAfterViewInit(): void {

        this.contentView.nativeElement.opacity = 100;
        this.setNavigation();

        //this.contentView.nativeElement.visibility = "hidden";
        /*
        this.contentView.nativeElement.animate({
            opacity: 100,
            duration: 500
        });
        */
        
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

        this.forms = JSON.parse(getString("studyForms"));
        const id = this.route.snapshot.params["form_name"];
        this.form = this.forms.filter(form => form.form_name === id)[0];

        this.administeredItems = [];

        this.setUser(); //need to setUser after this.form, but before this.toFormGroup

        this.fields = this.form.fields;

        this.myForm = this.toFormGroup(this.fields);
 
        var _position = this.route.snapshot.params["position"];
        if (isNaN(_position)){
            this.position = 0;
        }else{
            this.position = parseInt(_position);
        }

        this.paginate(this.position);

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

            if(this._fields[i].field_type == 'radio'){ // StackLayout is used for Listviews
                for(var j=0; j < this._fields[i].select_choices.length; j++){
                    if(this.page.getViewById(this._fields[i].field_name + "_" + this._fields[i].select_choices[j].value) == undefined){
                        continue;
                    }

                    let _StackLayout = <StackLayout>this.page.getViewById(this._fields[i].field_name + "_" + this._fields[i].select_choices[j].value);
                    _StackLayout.backgroundColor = "#edf0f2";

                }
            }

            if(this._fields[i].field_type == 'yesno'){

                let btn_No = <Button>this.page.getViewById(this._fields[i].field_name + "_0");
                let btn_Yes = <Button>this.page.getViewById(this._fields[i].field_name + "_1");

                btn_No.backgroundColor ="white";
                btn_Yes.backgroundColor ="white";

            }

        }

    }

    updateUI(){

        for(var j=0; j < this._fields.length; j++){
            if(this.myForm.value[this._fields[j].field_name] != ""){

                if(this._fields[j].field_type == "yesno"){

                    var value = this.myForm.value[this._fields[j].field_name];
                    if(value == "1"){
                        let btn = <Button>this.page.getViewById<Button>(this._fields[j].field_name + "_1");
                        btn.backgroundColor ="#30bcff";
                    }
                    if(value == "-1"){
                        let btn = <Button>this.page.getViewById(this._fields[j].field_name + "_0");
                        btn.backgroundColor ="#30bcff";
                    }

                }

                if(this._fields[j].field_type == "radio"){
                    let stack = <StackLayout>this.page.getViewById<StackLayout>(this._fields[j].field_name + "_" + this.myForm.value[this._fields[j].field_name]);
                    stack.backgroundColor ="#30bcff";
                } 

            }
        }
    }

    paginate(_position: number){
        this.position = _position;
        this.end = this.position + this.page_size;
        this._fields = this.fields.slice(this.position, this.end);


        this.administeredItems.push(this.position);


        // hide the follow-up questions if first questions is not 'YES'
        if(this._fields[0].answer != "1"){
        for(var i=1; i < this._fields.length; i++){
            this._fields[i].visibility = 'hidden';
            this.fields = this.fields.map(obj => this._fields.find(o => o.field_name === obj.field_name) || obj);
        }
        }

    }

    toFormGroup(questions: Studymetadata[] ) {
        let group: any = {};

        questions.forEach(question => {
            question.field_label = question.field_label.replace("[name]", this.user.name );
            this.parseHint(question.field_name, question.select_labels);
            //question.select_labels = this.parseResponses(question.select_labels);
            question.select_responses = this.parseResponses2(question.field_name, question.select_labels, question.select_choices);
            group[question.field_name] = new FormControl(question.field_name);
            group[question.field_name].value = "";
          
            if(question.field_name == "name"){
                group[question.field_name].value ="Enter your name";
            }

        });

        return new FormGroup(group);
    }

    parseResponses2(field_name: string, response: string[], scores:Responseoption[]):ListViewResponses[] {

        var rtn = [];
        //var pattern = "{(.*)";
        var pattern = "(.*){(.*)}";
        for(var i=0; i < response.length; i++){

            var _key = "";
            var _hint = "";

           if(response[i] != null){
                if(response[i].match(pattern) != null){ 
                    _hint = response[i].match(pattern)[2];
                    _key = response[i].match(pattern)[1];
                    //response[i] = "<b>" + _key + "</b>:" + _hint;
                    //console.log(response[i]);
                }
                /*
                if(response[i].match(pattern) != null){
                    var search = "{" + response[i].match(pattern)[1];
                    response[i] = response[i].replace(search, "");
                }
                */
            }

            var lvr = new ListViewResponses();
            lvr.field_name = field_name;
            lvr.response_name = _key; //response[i];
            lvr.response_label = _hint; //response[i];
            lvr.response_value = parseInt(scores[i].value);
            lvr.answer = "";
            rtn.push(lvr);


         }
         return rtn;

    }

    parseResponses(response: string[]):string[] {

        var pattern = "{(.*)";
        for(var i=0; i < response.length; i++){
           if(response[i] != null){
                if(response[i].match(pattern) != null){
                    var search = "{" + response[i].match(pattern)[1];
                    response[i] = response[i].replace(search, "");
                }
            }
         }
         return response;

    }

    displayHint(args:string){

        var title = this.fields.filter(field => field.field_name === args)[0].field_label;

        let options = {
            context: {"title": title, "code":this.hint[args]},
            fullscreen: true,
            viewContainerRef: this.vcRef
        };

        this.modal.showModal(HintComponent, options).then(res => {

            var _field = this.fields.filter(field => field.field_name === args);

            if(_field.length > 0){

                var response = _field[0].select_responses.filter(o => o.response_name.trim() == res.trim());
                if(response.length > 0){
                
                    _field[0].answer = response[0].response_value.toString();

                    for(var j=0; j < _field[0].select_responses.length; j++){
                        _field[0].select_responses[j].answer = _field[0].answer;
                    }

                    this.myForm.value[_field[0].field_name] = _field[0].answer;

                    this.fields = this.fields.map(obj => _field.find(o => o.field_name === obj.field_name) || obj);

                    //caching data in case not connected.
                    this.cacheService.addData(this.user, this.myForm, this.form.form_name);
                    
                    this.contentView.nativeElement.refresh();
                }
            }

        });
   
    }

    parseHint(key: string, response: string[]){

        var itemHints = [];
        var pattern = "(.*){(.*)}";
        for(var i=0; i < response.length; i++){
        
           if( response[i] != null && response[i] != "" ){

                response[i] = response[i].replace("[name]", this.user.name );

                if(response[i].match(pattern) != null){ 
                    var _hint = response[i].match(pattern)[2];
                    var _key = response[i].match(pattern)[1];
                    var _responseHint = new LooseObject();
                    _responseHint.key = _key;
                    _responseHint.value = _hint;
                    //itemHints.push(_key + " = " +  _hint );
                    itemHints.push( _responseHint );
                }

            }
         }

         if(itemHints.length >0){
            this.hint[key] = itemHints;
         }

    }

    saveFormData(data: any){

        var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);
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

    onSwitchChecked(args: EventData){

        let button = <Button>args.object;
        let field_name = button.id.substring(0, button.id.length -2 );

        let btn_No = <Button>this.page.getViewById(field_name + "_0");
        let btn_Yes = <Button>this.page.getViewById(field_name + "_1");

        let _controls = this.fields.filter(control => control.field_name === field_name);
        if(button === btn_Yes){
            this.myForm.value[field_name] = 1;
            _controls[0].answer = "1";

            // hide the follow-up questions initially
            for(var i=1; i < this._fields.length; i++){
                this._fields[i].visibility = 'visible';
                this.fields = this.fields.map(obj => this._fields.find(o => o.field_name === obj.field_name) || obj);
            }

        }
        if(button === btn_No){
            this.myForm.value[field_name] = -1;
            _controls[0].answer = "-1";
        }

        this.fields = this.fields.map(obj => _controls.find(o => o.field_name === obj.field_name) || obj);
        this.contentView.nativeElement.refresh();

        //caching data in case not connected.
        this.cacheService.addData(this.user, this.myForm, this.form.form_name);

    }

    onSwitch2Checked(args: EventData){

        let button = <Button>args.object;
        let field_name = button.id.substring(0, button.id.length -2 );

        let btn_No = <Button>this.page.getViewById(field_name + "_0");
        let btn_Yes = <Button>this.page.getViewById(field_name + "_1");
        let btn_NA = <Button>this.page.getViewById(field_name + "_2");

        let _controls = this.fields.filter(control => control.field_name === field_name);
        if(button === btn_Yes){
            this.myForm.value[field_name] = 1;
            _controls[0].answer = "1";

            // hide the follow-up questions initially
            for(var i=1; i < this._fields.length; i++){
                this._fields[i].visibility = 'visible';
                this.fields = this.fields.map(obj => this._fields.find(o => o.field_name === obj.field_name) || obj);
            }

        }
        if(button === btn_No){
            this.myForm.value[field_name] = -1;
            _controls[0].answer = "-1";

            // skip to the next domain
            //this.end = this.position + 3;  //10-11-2019  only if the this.page_size = 1

        }
        if(button === btn_NA){
            this.myForm.value[field_name] = 2;
            _controls[0].answer = "2";
            // skip to the next domain
            //this.end = this.position + 3;  //10-11-2019  only if the this.page_size = 1

        }

        this.fields = this.fields.map(obj => _controls.find(o => o.field_name === obj.field_name) || obj);
        this.contentView.nativeElement.refresh();

        //caching data in case not connected.
        this.cacheService.addData(this.user, this.myForm, this.form.form_name);

    }

    onSelectResponse(args){
 
        for(var i=0; i < args.object.items.length; i++ ){
            let _StackLayout = <StackLayout>this.page.getViewById(args.object.id + "_" + args.object.items[i].response_value);
           // _StackLayout.backgroundColor = "#edf0f2";
        }


        var _fields = this.fields.filter(field => field.field_name === args.object.id);
        var responsescore =  _fields[0].select_choices; // Responseoption[]

        //args.view.backgroundColor ="#30bcff";
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

        var count = 0;
        for(var j=0; j < this._fields.length; j++){
            var value = this.myForm.value[ this._fields[j].field_name ];
            if(value){
                count = count + 1;
            }
        }

        if(this._fields.length != count && !this.isWarned  ){
            dialogs.alert({
            title: "Missing Data",
            message: "Question(s) has not been answered.",
            okButtonText: "Close"
            }).then(r => {  this.isWarned = true; });
        } else{
            this.processData();
        }

    }

    processData(){

        this.isWarned = false;

        this.clearPage();
        this.position = this.end;

        if(this.position >= this.fields.length){

            this.saveFormData(this.myForm.value);
            
            this.routerExtensions.navigate(["/forms"], {
            transition: {
                name: "flip",
                duration: 400,
                curve: "linear"
            }
            });

        }else{       
            this.paginate(this.position);
            this.setNavigation();
        }

    }

    submit(args: EventData){

        this.validateData();
    
    }

    submit2(args: EventData){

        this.clearPage();
        this.position = this.end;

        if(this.position >= this.fields.length){
            this.saveFormData(this.myForm.value);
            this.routerExtensions.navigate(["/forms"], {
            transition: {
                name: "flip",
                duration: 400,
                curve: "linear"
            }
            });

        }else{
            this.paginate(this.position);
            this.setNavigation();
        }
    
    }

}
