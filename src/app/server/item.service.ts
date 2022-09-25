import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Device } from '@nativescript/core';
import { SecureStorage } from "@nativescript/secure-storage"; // require the plugin

import { Studydata } from '../model/studydata';
import { Studymetadata } from '../model/studymetadata';
import { Responseoption } from '../model/responseoption';
import { Studyform } from '../model/studyform';
import { UserModel } from '../model/user';
import { LooseObject } from '../model/looseobject';
import { REDCap } from "../model/redcap";


import { Observable} from "rxjs";
import {map} from 'rxjs/operators';

  const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded','Accept':'application/json' }) 
  };

@Injectable()
export class ItemService {

  secureStorage: SecureStorage;

  constructor(private http: HttpClient) { 
      this.secureStorage = new SecureStorage(); 
      if (this.secureStorage.isFirstRunSync()) {
          const success = this.secureStorage.clearAllOnFirstRunSync();
      }
  }

  getServer(): REDCap{
    return JSON.parse(this.secureStorage.getSync({key: "server"}));
  }

  setServer(redcap:REDCap): boolean{
    return this.secureStorage.setSync({key: "server",value: JSON.stringify( redcap )});
  }

  getRecordID(): Observable<any>{
    //console.log("getRecordID");
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' +  '&fields=' + 'record_id';    
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getUsers(): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&forms=' + 'registration' + '&filterLogic=' + '[uuid]=\''+ Device.uuid + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getWindowByRecordID(record_id:string): Observable<any>{
    let redcap = this.getServer();
    let _forms = "xx_sunday,xx_monday,xx_tuesday,xx_wednesday,xx_thursday,xx_friday,xx_saturday";
    let _fields = "record_id";
    let _filterLogic = "[record_id] = " + record_id + " AND  ( [time_start_sun] != \'\' OR [time_start_mon] != \'\' OR [time_start_tue] != \'\' OR [time_start_wed] != \'\' OR [time_start_thur] != \'\' OR [time_start_fri] != \'\' OR [time_start_sat] != \'\') "; 
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + _fields  + '&forms=' + _forms + '&filterLogic=' + _filterLogic ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getUsersByDevice(uuid:string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'registration' + '&filterLogic=' + '[uuid]=\''+ uuid + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getDevice(_phone:string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'phones' + '&filterLogic=' + '[phone]=\''+ _phone + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getDevices(_phone:string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id,uuid,phone_uuid,phone' + '&filterLogic=' + '[phone]=\''+ _phone + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getDevicePhoneNumber(uuid:string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id,uuid,phone_uuid,phone' + '&filterLogic=' + '[uuid]=\''+ uuid + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getPhones(_phone:string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'phones' + '&filterLogic=' + '[phone]=\''+ _phone + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);
  }

  getUserData(user: UserModel, form_name:string ): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json'+ '&exportSurveyFields=' + 'true' + '&filterLogic=[' + form_name + '_observantid]='+ user.record_id;
    return this.http.post<any>(redcap.url,data,httpOptions);      
  }

  getFormInstanceData(form: string, record_id: string): Observable<any>{
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&exportSurveyFields=' + 'true' +  '&fields=' + 'record_id' + '&forms=' + form;
    return this.http.post<any>(redcap.url,data,httpOptions).pipe(map(
      fields => {
        let forms = fields.filter( (e) => (e.record_id === record_id  && e.redcap_repeat_instrument === form) ) ;
        return forms;
      }
    ));
  }

  saveData(formData: string): Observable<any>{    
    let redcap = this.getServer();
    let data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' +  '&overwriteBehavior=' + 'normal' + '&data=' + formData ; 
    return this.http.post<any>(redcap.url,data,httpOptions); 
  }


 createResponseOptions(select_choices_or_calculations: string): Responseoption[] {
    
      let options = new Array<Responseoption>();
      let xoptions = select_choices_or_calculations.split("|");

      for (var index = 0; index < xoptions.length; ++index) {
        let x = xoptions[index].split(",");
        let response = new Responseoption();
        response.value = x[0].trim();

         let labeltext = "";
         for(var i =1; i < x.length; i++){
          labeltext = labeltext + x[i] + ",";
         } 

        response.label = labeltext;
        options.push(response);
      }
      return options;
  }

  createLabelOptions(select_choices_or_calculations: string): any[] {
    
    let options = []; 
    let xoptions = select_choices_or_calculations.split("|");

    for (var index = 0; index < xoptions.length; ++index) {
      let x = xoptions[index].split(",");
      let labeltext = "";
      for(var i =1; i < x.length; i++){
        labeltext = labeltext + x[i] + ",";
      } 

      options.push(labeltext);

    }
    return options;
  }
}
