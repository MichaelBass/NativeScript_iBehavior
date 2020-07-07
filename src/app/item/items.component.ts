import { Component, OnInit, Inject } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { KVObject } from './kvobject';
import { Observable } from "rxjs/Observable";
import { Studyform } from './studyform';
import { Studymetadata } from './studymetadata';
import { ItemService } from "./item.service";
import {RouterExtensions} from "nativescript-angular/router";
import * as dialogs from "tns-core-modules/ui/dialogs";


// import { Store } from 'redux';
// import { AppStore } from '../app.store';
// import { AppState } from '../app.state';
//import * as UserActions from '../user.actions';

import { UserModel } from './user';
import { Schedule } from './schedule';

import {getString, setString, hasKey} from "tns-core-modules/application-settings";
import { REDCap } from "./redcap";


const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded','Accept':'application/json' }) 
};

interface LooseObject {
    [key: string]: any
}

@Component({
    selector: "ns-items",
    moduleId: module.id,
    templateUrl: "./items.component.html",
    styleUrls:["./items.css"]
})
export class ItemsComponent implements OnInit {

    forms: Array<Studyform> = [];
    situation_form: Studyform;
    form: Studyform;
    fields: Studymetadata[];
    user : UserModel;
    schedule : Schedule;
    redcap: REDCap;

    activeSituation: Boolean;


    constructor(private itemService: ItemService, private routerExtensions: RouterExtensions, private http: HttpClient) { }

    ngOnInit(): void {

        if(!hasKey("server")){

            let options = {
                title: "Settings",
                message: "Setting have not been configured!",
                okButtonText: "OK"
            };
            alert(options);

        }else{
            this.redcap = JSON.parse(getString("server"));
        }


        if(hasKey("studyForms")){
            this.forms = JSON.parse(getString("studyForms"));
            this.situation_form = JSON.parse(getString("situationForm"));
        } else{
            this.submit();
        } 

        if(hasKey("ActiveUser")){
           this.user = JSON.parse(getString("ActiveUser"));
        //}else{
        //    this.user = this.store.getState().user; 
        }   
    }

    setSchedule(): Schedule{

        var window = parseInt(this.redcap.assessment_time); // 30*1000; //24*60*60*1000;
        var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);
        if(_schedules.length == 0){// add form to schedule

            var form_schedule = new Schedule();
            form_schedule.redcap_repeat_instance = 1;
            form_schedule.redcap_repeat_instrument = this.form.form_name;
            form_schedule.start = new Date();
            form_schedule.end = new Date(form_schedule.start.getTime() + window);

            this.user.schedule.push(form_schedule);
            _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);
        } 

        var currentDate = new Date();
        if (currentDate > new Date(_schedules[0].start) && currentDate > new Date(_schedules[0].end)){
            //console.log("Increment instance" + this.form.form_name + " : " + this.user.name);
            _schedules[0].redcap_repeat_instance +=1;
            _schedules[0].start = new Date();
            _schedules[0].end = new Date(_schedules[0].start.getTime() + window);

            this.user.schedule = this.user.schedule.map(obj => _schedules.find(o => o.redcap_repeat_instrument === obj.redcap_repeat_instrument) || obj);

        }

        return _schedules[0];

    }

    getSchedule(form_name:string){

        var situationSchedule = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);

        var form_schedule = new Schedule();
        form_schedule.redcap_repeat_instance = situationSchedule[0].redcap_repeat_instance;
        form_schedule.redcap_repeat_instrument = form_name;
        form_schedule.start = situationSchedule[0].start;
        form_schedule.end = situationSchedule[0].end;

        if(_schedules.length == 0){
            //_schedules[0] = form_schedule;
            this.user.schedule.push(form_schedule);
        }else{
            //this.user.schedule = this.user.schedule.map(obj => _schedules.find(o => o.redcap_repeat_instrument === obj.redcap_repeat_instrument) || obj);            
            _schedules[0].start = situationSchedule[0].start;
            _schedules[0].end = situationSchedule[0].end;
            _schedules[0].redcap_repeat_instance  = situationSchedule[0].redcap_repeat_instance;

        }

    }

    setSituationSchedule() {

        var window = parseInt(this.redcap.assessment_time); // 30*1000; //24*60*60*1000;
        this.activeSituation = false;
        var _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        var currentDate = new Date();

        if(_schedules.length == 0){// add form to schedule

            //console.log("no schedule exists: " + this.form.form_name + " : " + this.user.name );
            var form_schedule = new Schedule();
            form_schedule.redcap_repeat_instance = 1;
            form_schedule.redcap_repeat_instrument = "situation";
            form_schedule.start = currentDate;
            form_schedule.end = new Date(form_schedule.start.getTime() + window);

            this.user.schedule.push(form_schedule);
            _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
            return;
        } 

        if ( (currentDate > new Date(_schedules[0].start)) && (currentDate > new Date(_schedules[0].end)) ){

            _schedules[0].redcap_repeat_instance +=1;
            _schedules[0].start = new Date();
            _schedules[0].end = new Date(_schedules[0].start.getTime() + window);
            this.user.schedule = this.user.schedule.map(obj => _schedules.find(o => o.redcap_repeat_instrument === obj.redcap_repeat_instrument) || obj);
            this.activeSituation = false;   
        } else {
            this.activeSituation = true;
        }

    }

    onConfirm(args){

        this.form = this.forms.filter(form => form.form_name === this.forms[args.index].form_name)[0];
        this.fields = this.form.fields;

        this.setSituationSchedule();
        this.getSchedule(this.form.form_name);

        setString("ActiveUser", JSON.stringify(this.user));

        if(this.activeSituation){
            // console.log("display: " + this.form.form_name);
            this.flipToNextPage();
        }else{
            // console.log("display: Situation");
            setString("redirectForm", this.form.form_name);
            this.displaySituation();
        }
             
/*
        dialogs.action({
            title: this.forms[0].form_label,
            message: _title,
            actions: ["Yes", "No"]
            
        }).then(result => {
            if(result === "Yes"){
                var data = JSON.parse("{\"" + _field_name + "\":1}");
                //this.saveFormData(data);

                args.view.backgroundColor ="green";
                this.flipToNextPage();
            }else{
                var data = JSON.parse("{\"" + _field_name + "\":0}");
                //this.saveFormData(data);
                args.view.backgroundColor ="red";
            }
        });
*/

    }

    submit(){
    
  
      var redcap = JSON.parse(getString("server"));
      var dataInstruments = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'assessments' + '&returnFormat=' + 'json';
      var dataMeta = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'metadata' + '&returnFormat=' + 'json';

      let instruments = Array<KVObject>();
      let _forms = new Array<Studyform>();

      this.http.post<any[]>(redcap.url,dataInstruments,httpOptions).subscribe(
        redcap_instruments => {

          for(var i = 0; i < redcap_instruments.length; i++) {
            var obj = new KVObject();
            obj.key = redcap_instruments[i].redcap_instrument;
            obj.value = redcap_instruments[i].redcap_display_name;                 
            instruments.push(obj); 
          }

          this.http.post<Studymetadata[]>(redcap.url,dataMeta,httpOptions).subscribe(
            redcap_MetaData => {

              for (let field of redcap_MetaData){

                if(field.form_name.toLocaleLowerCase().startsWith('xx')){
                  continue;
                }
                if(field.form_name == 'registration'){
                  continue;
                }
                if(field.form_name == 'assessments'){
                  continue;
                }
                if(field.form_name == 'phones'){
                  continue;
                }
                if(field.field_annotation == '@HIDDEN'){
                  continue;
                }
                var found = false;

                for(var i = 0; i < _forms.length; i++) {
                  if(_forms[i].form_name == field.form_name){
                    found = true;
                    field.select_choices = this.itemService.createResponseOptions(field.select_choices_or_calculations);
                    field.select_labels = this.itemService.createLabelOptions(field.select_choices_or_calculations);
                    field.answer = "";
                    field.visibility = "visible";
                    _forms[i].fields.push(field);
                    break;
                  }
                }

                if(!found){
                  var sf = new Studyform();
                  sf.form_name = field.form_name;
                  //search for the instrument label              
                  sf.form_label = instruments.filter(instrument => instrument.key === sf.form_name)[0].value;             
                  sf.fields = new Array();
                  field.select_choices = this.itemService.createResponseOptions(field.select_choices_or_calculations);
                  field.select_labels = this.itemService.createLabelOptions(field.select_choices_or_calculations);
                  field.answer = "";
                  field.visibility = "visible";
                  sf.fields.push(field);
                  _forms.push(sf);
                }       
              }


                //forms should be populated here.
                this.forms = _forms.filter(fields => fields.form_name != "situation");
                this.situation_form = _forms.filter(fields => fields.form_name === "situation")[0];
                setString("studyForms", JSON.stringify(this.forms));
                setString("situationForm", JSON.stringify(this.situation_form));

                let options = {
                    title: "Form List",
                    message: this.forms.length + " form(s) updated.",
                    okButtonText: "OK"
                };
                alert(options);                
            }

          );

        }

      );


        /*    
        this.itemService.getItems().subscribe(
            fields => {
                //this.forms = fields;
                this.forms = fields.filter(fields => fields.form_name != "situation");
                this.situation_form = fields.filter(fields => fields.form_name === "situation")[0];

                setString("studyForms", JSON.stringify(this.forms));
                setString("situationForm", JSON.stringify(this.situation_form));

                let options = {
                    title: "Form List",
                    message: this.forms.length + " form(s) updated.",
                    okButtonText: "OK"
                };
                alert(options);
            }

        );
        */
    }

    displaySituation(){

        this.routerExtensions.navigate(["/situation"], {
        transition: {
            name: "fade",
            duration: 800,
            curve: "linear"
        }
        });
    }

    flipToNextPage() {

        this.routerExtensions.navigate(["/form", this.form.form_name], {
        transition: {
            name: "flip",
            duration: 400,
            curve: "linear"
        }
        });

    }

    saveFormData(data: any){

        var obj: LooseObject = {};
        obj.record_id = this.user.record_id;

        for (let key of Object.keys(data)) {
            obj[key] = data[key]; 
        } 
        obj["redcap_repeat_instrument"] = this.schedule.redcap_repeat_instrument;
        obj["redcap_repeat_instance"] = this.schedule.redcap_repeat_instance.toString();
        setString("redcap_repeat_instance", obj["redcap_repeat_instance"] );

        //tag each record with an user-defined record-id so data can be pulled with filterLogic.
        obj["observantid"] = this.user.record_id;
        obj["date_entered"] = new Date().toLocaleString();
        var myPackage =[];
        myPackage.push(obj);

        this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
            fields => {
                //console.log(fields);  
            }
        );

/*

        this.itemService.getFormInstanceData(this.form.form_name, this.user.record_id).subscribe(
            fields =>{

                var instance = 0;
                if(fields.length>0){
                    instance = parseInt(fields[fields.length -1].redcap_repeat_instance);
                }

                var obj: LooseObject = {};
                obj.record_id = this.user.record_id;

                for (let key of Object.keys(data)) {
                    obj[key] = data[key]; 
                } 

                // increment instance if not first time administered
                if (!isNaN(instance)) {
                    obj["redcap_repeat_instrument"] = this.form.form_name;
                    obj["redcap_repeat_instance"] = instance + 1;
                }else{
                    obj["redcap_repeat_instrument"] = this.form.form_name;
                    obj["redcap_repeat_instance"] = 1;
                }

                setString("redcap_repeat_instance", obj["redcap_repeat_instance"] );
                //console.log("redcap_repeat_instance" + ":" + obj["redcap_repeat_instance"]);

                //tag each record with an user-defined record-id so data can be pulled with filterLogic.
                obj["observantid"] = this.user.record_id;
                obj["date_entered"] = new Date().toLocaleString();
                var myPackage =[];
                myPackage.push(obj);
                //console.log(myPackage);

                this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                    fields => {
                        console.log(fields);  
                    }
                );
            }
        );
*/


    }


}