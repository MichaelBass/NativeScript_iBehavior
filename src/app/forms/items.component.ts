import { Component, OnInit, Inject } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {RouterExtensions} from "@nativescript/angular";
import { ApplicationSettings, isAndroid, isIOS } from '@nativescript/core';

import { KVObject } from '../model/kvobject';
import { Studyform } from '../model/studyform';
import { Studymetadata } from '../model/studymetadata';
import { UserModel } from '../model/user';
import { Schedule } from '../model/schedule';
import { REDCap } from "../model/redcap";

import { ItemService } from "../server/item.service";
import { CacheService } from "../server/cache.service";

import { Observable } from "rxjs";

const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded','Accept':'application/json' }) 
};

interface LooseObject {
    [key: string]: any
}

interface LooseObject2 {
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
    situationInstance: number;

    activeSituation: Boolean;

    platform: string;

    constructor(private itemService: ItemService, private cacheService: CacheService, private routerExtensions: RouterExtensions, private http: HttpClient) {
        if (isAndroid) {
            this.platform ="Android";
        } else if (isIOS) {
            this.platform ="iOS";
        }  
    }

    ngOnInit(): void {


        let _reBuildForms = "true";

        if(this.itemService.getServer() === null ){
            let options = {
                title: "Settings",
                message: "Setting have not been configured!",
                okButtonText: "OK"
            };
            alert(options);

        }else{
            this.redcap = this.itemService.getServer();
        }

        if(ApplicationSettings.hasKey("ActiveUser")){
           this.user = JSON.parse(ApplicationSettings.getString("ActiveUser"));
            if(ApplicationSettings.getString("UserChanged") == "true"){
                ApplicationSettings.setString("UserChanged", "false");
                _reBuildForms = "false";
                this.submit();
            }


        } else {
            let options = {
                title: "Settings",
                message: "User/Child must be selected first!",
                okButtonText: "OK"
            };
            alert(options);

            this.routerExtensions.navigate(["/users"], {
            transition: {
                name: "fade",
                duration: 400,
                curve: "linear"
            }
            });


            return;
        }

        if(ApplicationSettings.hasKey("studyForms")){

            try{
            this.forms = JSON.parse(ApplicationSettings.getString("studyForms"));
            this.situation_form = JSON.parse(ApplicationSettings.getString("situationForm"));
            } catch(error){ // 2022-05-19 try to rebuild if any errors occur when accessing studyForms from the settings

                let optionsForms = {
                    title: "Domains error",
                    message: "The Domains are not configured correctly, please tell the research staff!",
                    okButtonText: "OK"
                };
                alert(optionsForms);

                this.submit();
            } 
        } else{
            if(_reBuildForms == "true"){
                this.submit();
            }
        } 
        this.resetForms(); // check if finish indicator needs to be reset.   
    }

    getSchedule(form_name:string){

        /*
        Assumption: there is one and only one situation form in the user's schedule  
        */

        let situationSchedule = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        if(situationSchedule.length == 0){
            return false;
        }

        let _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === this.form.form_name);

        let form_schedule = new Schedule();
        form_schedule.redcap_repeat_instance = situationSchedule[0].redcap_repeat_instance;
        form_schedule.redcap_repeat_instrument = form_name;
        form_schedule.start = situationSchedule[0].start;
        form_schedule.end = situationSchedule[0].end;

        if(_schedules.length == 0){
            this.user.schedule.push(form_schedule);
        }else{           
            _schedules[0].start = situationSchedule[0].start;
            _schedules[0].end = situationSchedule[0].end;
            _schedules[0].redcap_repeat_instance  = situationSchedule[0].redcap_repeat_instance;
        }
      
        this.removeCachedForm(form_name);

        return true;

    }

    removeCachedForm(form_name:string){
        if(ApplicationSettings.hasKey("cacheResponse")){
            let myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));
            for(var i=0; i < myPackage.length; i++){
                if(myPackage[i].record_id == this.user.record_id && myPackage[i].redcap_repeat_instrument === form_name){
                    let obj: LooseObject2 = {};
                    obj.record_id = this.user.record_id;
                    obj["redcap_repeat_instrument"] = form_name;
                    obj["redcap_repeat_instance"] = myPackage[i].redcap_repeat_instance;
                    obj[form_name + "_observantid"] = this.user.record_id;
                    this.cacheService.removeData(obj, form_name); 
                }
            }
        }   
    }

    checkSituationSchedule(){ /* remove cached situation if exisits.  If it does set instance to the cached value */

        let cachedInstance = -1;
        if(ApplicationSettings.hasKey("cacheResponse")){
            let myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));
            for(var i=0; i < myPackage.length; i++){
                if(myPackage[i].record_id == this.user.record_id && myPackage[i].redcap_repeat_instrument === "situation"){
                    cachedInstance = parseInt(myPackage[i].redcap_repeat_instance);
                    let obj: LooseObject2 = {};
                    obj.record_id = this.user.record_id;
                    obj["redcap_repeat_instrument"] = "situation";
                    obj["redcap_repeat_instance"] = cachedInstance.toString();
                    obj["situation_observantid"] = this.user.record_id;
                    this.cacheService.removeData(obj, "situation"); 
                }
            }
        }

        return cachedInstance;    
    }

    setSituationSchedule() {

        let window = parseInt(this.redcap.assessment_time); // 30*1000; //24*60*60*1000;
        this.activeSituation = false;
        let _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        let currentDate = new Date();

        // check to see if user quit during Situation screen.
        let _cachedInstance = this.checkSituationSchedule();

        if(_schedules.length == 0){// add form to schedule

            let form_schedule = new Schedule();
            form_schedule.redcap_repeat_instance = this.situationInstance + 1;
            form_schedule.redcap_repeat_instrument = "situation";
            form_schedule.start = currentDate;
            form_schedule.end = new Date(form_schedule.start.getTime() + window);

            this.user.schedule.push(form_schedule);
            _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");

            return;

        } 

        if ( (currentDate > new Date(_schedules[0].start)) && (currentDate > new Date(_schedules[0].end)) ){
            
            /*
            TODO:  Need to verify whick instance to use when checking or incrementing the situation instance
                _cachedInstance - cached value if exists.
                situationInstance - last value from REDCap
                _schedules[0].redcap_repeat_instance - current value in this.userschedule.
            */

            if( _cachedInstance != -1){
                _schedules[0].redcap_repeat_instance = _cachedInstance;
            }else{ 
                _schedules[0].redcap_repeat_instance = _schedules[0].redcap_repeat_instance + 1;
            }

            _schedules[0].start = new Date();
            _schedules[0].end = new Date(_schedules[0].start.getTime() + window);
            this.user.schedule = this.user.schedule.map(obj => _schedules.find(o => o.redcap_repeat_instrument === obj.redcap_repeat_instrument) || obj);
            this.activeSituation = false;
        } else {
            if( _cachedInstance != -1){
                _schedules[0].redcap_repeat_instance = _cachedInstance;
                _schedules[0].start = new Date();
                _schedules[0].end = new Date(_schedules[0].start.getTime() + window);
                this.user.schedule = this.user.schedule.map(obj => _schedules.find(o => o.redcap_repeat_instrument === obj.redcap_repeat_instrument) || obj);
                this.activeSituation = false;  
            }else{
                this.activeSituation = true;
            }
        }

    }

    resetForms(){

        let window = parseInt(this.redcap.assessment_time); // 30*1000; //24*60*60*1000;
        let _schedules = this.user.schedule.filter(schedule => schedule.redcap_repeat_instrument === "situation");
        let currentDate = new Date();

        if(_schedules.length == 0 || ((currentDate > new Date(_schedules[0].start)) && (currentDate > new Date(_schedules[0].end))) ){
            for(var i = 0; i < this.forms.length; i++) {
                this.forms[i].status = "";
            }
            ApplicationSettings.setString("studyForms", JSON.stringify(this.forms));
        }
    }

    onConfirm(args){


        this.form = this.forms.filter(form => form.form_name === this.forms[args.index].form_name)[0];

        if(this.form.status == "Done"){
            return;
        }
        
        this.fields = this.form.fields;

        let redcap = this.itemService.getServer();

        // 2023-04-27  remove redcap_repeat_instrument, redcap_repeat_instance fields
        /* let situationInstance = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'situation' + '&fields=' + 'record_id,redcap_repeat_instrument,redcap_repeat_instance,situation_observantid'+ '&filterLogic=' + '[situation_observantid]=\'' + this.user.record_id + '\'' + '&returnFormat=' + 'json'; */
        let situationInstance = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'situation' + '&fields=' + 'record_id,situation_observantid'+ '&filterLogic=' + '[situation_observantid]=\'' + this.user.record_id + '\'' + '&returnFormat=' + 'json'; 

 
        return this.http.post<any[]>(redcap.url,situationInstance,httpOptions).subscribe(
        instances => {

            let lastsaved_Instance = 0;
            if(instances.length > 0 ){
                lastsaved_Instance =  Math.max.apply(Math, instances.map(function(o) { return o.redcap_repeat_instance; }));
            }

            this.situationInstance = lastsaved_Instance;

            /* 
            The code below is wrapped in the Observer that first grabs the latest REDCap situation instance. 
            this is needed just in case the user switcher person which reset the schedule 
            */

            this.setSituationSchedule();

            if(this.getSchedule(this.form.form_name)){
                ApplicationSettings.setString("ActiveUser", JSON.stringify(this.user));

                if(this.activeSituation){
                    this.flipToNextPage();
                }else{
                    this.resetForms();
                    ApplicationSettings.setString("redirectForm", this.form.form_name);
                    this.displaySituation();
                }
            }else{
                let options = {
                    title: "Error - accessing user records",
                    message: "Please reactivate user from user screen!",
                    okButtonText: "OK"
                };
                alert(options);
            }


        });
     
    }


    submit(){

        if(!ApplicationSettings.hasKey("ActiveUser")){
            let options = {
                title: "Settings",
                message: "User/Child must be selected first!",
                okButtonText: "OK"
            };
            alert(options);

            this.routerExtensions.navigate(["/users"], {
            transition: {
                name: "fade",
                duration: 400,
                curve: "linear"
            }
            });
        } 
              
      let redcap = this.itemService.getServer();
      // let dataInstruments = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'assessments' + '&returnFormat=' + 'json';
      let dataInstruments = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'metadata' + '&returnFormat=' + 'json' + '&forms[0]=xx_domains';
      let dataMeta = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'metadata' + '&returnFormat=' + 'json';

      let instruments = Array<KVObject>();

        let obj_Situation = new KVObject();
        obj_Situation.key = "situation";
        obj_Situation.value = "Situation"; 
        instruments.push(obj_Situation);

      let _forms = new Array<Studyform>();

      let filteredInstruments = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'xx_domains' + '&filterLogic=' + '[record_id]=\'' + this.user.record_id + '\'' + '&returnFormat=' + 'json';
      let _filteredInstruments = Array<string>();

        // generate the domain filter by user //
          this.http.post<any[]>(redcap.url,filteredInstruments,httpOptions).subscribe(
            redcap_Filter => {
                         
              for(var i = 0; i < redcap_Filter.length; i++) { 
                let obj = redcap_Filter[i];             
                for (let key of Object.keys(obj)) {
                    if(obj[key]== "1"){                                        
                        _filteredInstruments.push(key);
                    }
                }
              }

              this.http.post<any[]>(redcap.url,dataInstruments,httpOptions).subscribe(
                redcap_instruments => {                
                  for(var i = 0; i < redcap_instruments.length; i++) {
                    let obj = new KVObject(); 
                    obj.key = redcap_instruments[i].field_name;
                    obj.value = redcap_instruments[i].field_label; 
                    
                    // obj.key = redcap_instruments[i].redcap_instrument;
                    // obj.value = redcap_instruments[i].redcap_display_name; 

                    instruments.push(obj); 
                  }


                  this.http.post<Studymetadata[]>(redcap.url,dataMeta,httpOptions).subscribe(
                    redcap_MetaData => {
                      for (let field of redcap_MetaData){

                        if(instruments.filter(fields => fields.key === field.form_name).length == 0){
                            // 2022-05-19 filter out any instruments not in the xx_domains instrument
                           continue;
                        }

                        // apply domain filter //
                        if(_filteredInstruments.length > 0 && (_filteredInstruments.indexOf(field.form_name) === -1 && field.form_name != "situation" ) ){
                            continue;
                        }
                        // apply domain filter //
 
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
        
                        ApplicationSettings.setString("studyForms", JSON.stringify(this.forms));
                        ApplicationSettings.setString("situationForm", JSON.stringify(this.situation_form));

                        let options = {
                            title: "Form List",
                            message: this.forms.length + " form(s) updated.",
                            okButtonText: "OK"
                        };

                        alert(options);                
                    }

                  ); // inner-most async call

                }

              );  // outer-most async call

      }); // generate the domain filter by user //
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

}