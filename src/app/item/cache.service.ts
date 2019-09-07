import { Injectable } from "@angular/core";
import { FormGroup } from '@angular/forms';
import { ItemService } from "./item.service";
import { UserModel } from './user';
import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import { device } from "tns-core-modules/platform";
import {Observable, of} from 'rxjs';


interface LooseObject2 {
    [key: string]: any
}

@Injectable()
export class CacheService {

  constructor(private itemService: ItemService) { }

    removeData(data: LooseObject2, form_name: string){

        if(hasKey("cacheResponse")){
          var myPackage = JSON.parse(getString("cacheResponse"));

          for(var i=0; i < myPackage.length; i++){
            if(myPackage[i]["redcap_repeat_instrument"] == data["redcap_repeat_instrument"] && myPackage[i]["redcap_repeat_instance"] == data["redcap_repeat_instance"] && myPackage[i][form_name + "_observantid"] == data[form_name + "_observantid"] ){  
                //console.log("removing: " + myPackage[i][form_name + "_observantid"] + ":" + myPackage[i]["redcap_repeat_instrument"] + "(" + myPackage[i]["redcap_repeat_instance"] + ")" );
                myPackage.splice(i,1);
                setString("cacheResponse", JSON.stringify(myPackage));
            }
          }
        }
    }

    createCachedObject(user: UserModel, form: FormGroup, form_name: string): LooseObject2 {

        var data = form.value;
        var _schedules = user.schedule.filter(schedule => schedule.redcap_repeat_instrument === form_name);
        var obj: LooseObject2 = {};
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

      var _data = this.createCachedObject(user,form,form_name);

      var myPackage = [];
      if(hasKey("cacheResponse")){
        myPackage = JSON.parse(getString("cacheResponse"));
      } 
      if(!myPackage){
        myPackage = [];
      }

      var _foundData = myPackage.find( function (obj){
        return _data.record_id === obj.record_id  && _data.redcap_repeat_instrument === obj.redcap_repeat_instrument && _data.redcap_repeat_instance === obj.redcap_repeat_instance
      });

      if (typeof _foundData  == 'undefined'){
        myPackage.push(_data);
      } else {
        var indexOfFirst = myPackage.indexOf(_foundData);
        myPackage[indexOfFirst] = _data;
      }

      setString("cacheResponse", JSON.stringify(myPackage));

    }

    resetCache(){
      setString("cacheResponse", "[]");
    }

    viewCache(){
      console.log(getString("cacheResponse"));
    }

    uploadCachedData(_myData: any):Observable<any> {

      return this.itemService.saveData("[" +  JSON.stringify(_myData) + "]" ).map(
        fields => { 
          this.removeData( _myData, _myData["redcap_repeat_instrument"] );
          return Observable.of(true);  
        }
      );

/*
      if(hasKey("cacheResponse")){
        var myPackage = JSON.parse(getString("cacheResponse"));
        for(var i=0; i < myPackage.length; i++){

          var _myData = JSON.stringify(myPackage[i]);
    

          if(myPackage[i]["redcap_repeat_instrument"] != form_name){
            console.log(myPackage[i]["redcap_repeat_instrument"] +" does not equal "+ form_name);
            continue;
          }

            this.itemService.saveData("[" +  _myData + "]" ).subscribe(
              fields => { 
                //var obj: LooseObject2 = {};
                this.removeData( JSON.parse(_myData), form_name );  
              }
            );
        }
      }
*/

    }

}
