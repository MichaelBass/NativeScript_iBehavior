import { Injectable } from "@angular/core";
import { FormGroup } from '@angular/forms';

import { ApplicationSettings } from '@nativescript/core';

import { ItemService } from "../server/item.service";
import { UserModel } from '../model/user';

import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';

interface LooseObject2 {
    [key: string]: any
}

@Injectable()
export class CacheService {

  constructor(private itemService: ItemService) { }

    removeData(data: LooseObject2, form_name: string){

        if(ApplicationSettings.hasKey("cacheResponse")){
          let myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));

          for(var i=0; i < myPackage.length; i++){
            if(myPackage[i]["redcap_repeat_instrument"] == data["redcap_repeat_instrument"] && myPackage[i]["redcap_repeat_instance"] == data["redcap_repeat_instance"] && myPackage[i][form_name + "_observantid"] == data[form_name + "_observantid"] ){  
                //console.log("removing: " + myPackage[i][form_name + "_observantid"] + ":" + myPackage[i]["redcap_repeat_instrument"] + "(" + myPackage[i]["redcap_repeat_instance"] + ")" );
                myPackage.splice(i,1);
                ApplicationSettings.setString("cacheResponse", JSON.stringify(myPackage));
            }
          }
        }
    }

    createCachedObject(user: UserModel, form: FormGroup, form_name: string): LooseObject2 {

        let data = form.value;
        let _schedules = user.schedule.filter(schedule => schedule.redcap_repeat_instrument === form_name);
        let obj: LooseObject2 = {};
        obj.record_id = user.record_id;

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
        obj[form_name + "_observantid"] = user.record_id;
        obj[form_name + "_date_entered"] = new Date().toLocaleString();

        return obj;
    }

    addData(user: UserModel, form: FormGroup, form_name: string){

      let _data = this.createCachedObject(user,form,form_name);
      let myPackage = [];

      if(ApplicationSettings.hasKey("cacheResponse")){
        myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));
      } 
      if(!myPackage){
        myPackage = [];
      }

      let _foundData = myPackage.find( function (obj){
        return _data.record_id === obj.record_id  && _data.redcap_repeat_instrument === obj.redcap_repeat_instrument && _data.redcap_repeat_instance === obj.redcap_repeat_instance
      });

      if (typeof _foundData  == 'undefined'){
        myPackage.push(_data);
      } else {
        let indexOfFirst = myPackage.indexOf(_foundData);
        myPackage[indexOfFirst] = _data;
      }

      ApplicationSettings.setString("cacheResponse", JSON.stringify(myPackage));

    }

    resetCache(){
      ApplicationSettings.setString("cacheResponse", "[]");
    }

    viewCache(){
      console.log(ApplicationSettings.getString("cacheResponse"));
    }

    uploadCachedData(_myData: any):Observable<any> {
      return this.itemService.saveData("[" +  JSON.stringify(_myData) + "]" ).pipe(map(
        fields => { 
          this.removeData( _myData, _myData["redcap_repeat_instrument"] );
          return of(true);  
        }
      ));
    }

}
