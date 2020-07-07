import { Injectable } from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from "rxjs/Observable";
import { Studydata } from './studydata';
import { Studymetadata } from './studymetadata';
import { Responseoption } from './responseoption';
import { Studyform } from './studyform';
import { of } from 'rxjs/observable/of';
import { catchError, map, tap } from 'rxjs/operators';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';
import { device } from "tns-core-modules/platform";
import { LooseObject } from './looseobject';
import { REDCap } from "./redcap";
///import 'rxjs/add/operator/shareReplay';
import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import { UserModel } from './user';

  const httpOptions = {
    headers: new HttpHeaders({ 'Content-Type': 'application/x-www-form-urlencoded','Accept':'application/json' }) 
  };

@Injectable()
export class ItemService {

  constructor(private http: HttpClient) { }

  getRecordID(): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' +  '&fields=' + 'record_id';    
    return this.http.post<any>(redcap.url,data,httpOptions); //.shareReplay();
  }

  getUsers(): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&forms=' + 'registration' + '&filterLogic=' + '[uuid]=\''+ device.uuid + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getWindowByRecordID(record_id:string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var _forms = "xx_sunday,xx_monday,xx_tuesday,xx_wednesday,xx_thursday,xx_friday,xx_saturday";
    var _fields = "record_id";
    var _filterLogic = "[record_id] = " + record_id + " AND  ( [time_start_sun] != \'\' OR [time_start_mon] != \'\' OR [time_start_tue] != \'\' OR [time_start_wed] != \'\' OR [time_start_thur] != \'\' OR [time_start_fri] != \'\' OR [time_start_sat] != \'\') "; 

    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + _fields  + '&forms=' + _forms + '&filterLogic=' + _filterLogic ;
    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getUsersByDevice(uuid:string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'registration' + '&filterLogic=' + '[uuid]=\''+ uuid + '\'' ;
    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getDevice(_phone:string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'phones' + '&filterLogic=' + '[phone]=\''+ _phone + '\'' ;

    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getDevicePhoneNumber(uuid:string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'phones' + '&filterLogic=' + '[phone_uuid]=\''+ uuid + '\'' ;

    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getPhones(_phone:string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' + '&fields=' + 'record_id' + '&forms=' + 'phones' + '&filterLogic=' + '[phone]=\''+ _phone + '\'' ;

    return this.http.post<any>(redcap.url,data,httpOptions);

  }

  getUserData(user: UserModel, form_name:string ): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json'+ '&exportSurveyFields=' + 'true' + '&filterLogic=[' + form_name + '_observantid]='+ user.record_id;
    return this.http.post<any>(redcap.url,data,httpOptions);      
  }

  getFormInstanceData(form: string, record_id: string): Observable<any>{
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&exportSurveyFields=' + 'true' +  '&fields=' + 'record_id' + '&forms=' + form;
    return this.http.post<any>(redcap.url,data,httpOptions).map(
      fields => {
        let forms = fields.filter( (e) => (e.record_id === record_id  && e.redcap_repeat_instrument === form) ) ;
        return forms;
      }
    );
  }

  saveData(formData: string): Observable<any>{    
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&returnFormat=' + 'json' + '&type=' + 'flat' +  '&overwriteBehavior=' + 'normal' + '&data=' + formData ; 
    return this.http.post<any>(redcap.url,data,httpOptions); //.shareReplay(); 
  }

  addProtocol(): Observable<any>{ 
    var redcap = JSON.parse(getString("server"));
    var data = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'metadata' + '&returnFormat=' + 'json';
    return this.http.post<Studymetadata[]>(redcap.url,data,httpOptions);
  }

 createResponseOptions(select_choices_or_calculations: string): Responseoption[] {
    
      var options = new Array<Responseoption>();
      
      var xoptions = select_choices_or_calculations.split("|");
      for (var index = 0; index < xoptions.length; ++index) {
        var x = xoptions[index].split(",");
        var response = new Responseoption();
        response.value = x[0].trim();

         var labeltext = "";
         for(var i =1; i < x.length; i++){
          labeltext = labeltext + x[i] + ",";
         } 

        response.label = labeltext;
        options.push(response);
      }
      return options;
  }

  createLabelOptions(select_choices_or_calculations: string): any[] {
    
    var options = [];
    
    var xoptions = select_choices_or_calculations.split("|");
    for (var index = 0; index < xoptions.length; ++index) {
      var x = xoptions[index].split(",");
      var labeltext = "";
      for(var i =1; i < x.length; i++){
        labeltext = labeltext + x[i] + ",";
      } 

      options.push(labeltext);
      //options.push(x[1]);

    }
    return options;
  }

/*
TODO: consider updating to rxjs 6, instead of using rxjs-compat
map changed along with import statement etc.
Below are some references:
https://stackoverflow.com/questions/50192815/map-doesnt-exist-on-observableobject-with-angular-6-0-0-and-rxjs-6-1-0
https://www.academind.com/learn/javascript/rxjs-6-what-changed/
*/

  getItems() : Observable<Studyform[]> {
  // https://blog.danieleghidoli.it/2016/10/22/http-rxjs-observables-angular/
      var redcap = JSON.parse(getString("server"));
      var dataInstruments = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'record' + '&forms=' + 'assessments' + '&returnFormat=' + 'json';
      var dataMeta = 'token=' + redcap.token + '&format=' + 'json' + '&content=' + 'metadata' + '&returnFormat=' + 'json';

      return Observable.forkJoin([
        this.http.post<any[]>(redcap.url,dataInstruments,httpOptions).map(res => res),
        this.http.post<Studymetadata[]>(redcap.url,dataMeta,httpOptions).map(res => res)
      ])
      .map((data:any[]) =>{

        let instruments = Array<LooseObject>();
        let forms = new Array<Studyform>();


        for(var i = 0; i < data[0].length; i++) {
          var obj = new LooseObject();
          obj.key = data[0][i].redcap_instrument;
          obj.value = data[0][i].redcap_display_name;                 
          instruments.push(obj); 
        }


        for (let field of data[1]){

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

            for(var i = 0; i < forms.length; i++) {
              if(forms[i].form_name == field.form_name){
                found = true;
                field.select_choices = this.createResponseOptions(field.select_choices_or_calculations);
                field.select_labels = this.createLabelOptions(field.select_choices_or_calculations);
                field.answer = "";
                field.visibility = "visible";
                forms[i].fields.push(field);
                break;
              }
            }

            if(!found){
              var sf = new Studyform();
              sf.form_name = field.form_name;
              //search for the instrument label              
              sf.form_label = instruments.filter(instrument => instrument.key === sf.form_name)[0].value;             
              sf.fields = new Array();
              field.select_choices = this.createResponseOptions(field.select_choices_or_calculations);
              field.select_labels = this.createLabelOptions(field.select_choices_or_calculations);
              field.answer = "";
              field.visibility = "visible";
              sf.fields.push(field);
              forms.push(sf);
            }       
        }
        return forms;

      });
  
  }

  handleErrors(error: Response) {
    console.log(JSON.stringify(error.json()));
    //return Observable.throw(error);
  }
}
