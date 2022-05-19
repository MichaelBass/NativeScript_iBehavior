import {Component, OnInit, Input, ChangeDetectionStrategy, Inject} from "@angular/core";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { RouterExtensions } from "@nativescript/angular";
import * as dialogs from '@nativescript/core/ui/dialogs';
import { TextView, Device, Page, ApplicationSettings } from '@nativescript/core';
import { SecureStorage } from "@nativescript/secure-storage"; // require the plugin

import { UserModel } from '../model/user';
import { Config } from "../model/config";
import { REDCap } from "../model/redcap";

import { ItemService } from "../server/item.service";

import { Observable} from "rxjs";
import {map} from 'rxjs/operators';

@Component({
    selector: "ns-users",
    moduleId: module.id,
    templateUrl: "./users.component.html",
    styleUrls:["./users.css"]
})

export class UsersComponent implements OnInit {

    public users: Array<UserModel>;
    public userName : string;
    public editState = true;
    currentuser : UserModel;

    redcap: REDCap;
    activeREDCap: string;
    visibility: string;
    secureStorage: SecureStorage;

    constructor(private page: Page, private itemService: ItemService, private http: HttpClient, private routerExtensions: RouterExtensions) { 
      this.secureStorage = new SecureStorage(); 
    }

    ngOnInit(): void {

      //if(!hasKey("server")){
      if( this.secureStorage.getSync({key: "server"}) === null ){
        this.visibility = "hidden";
        this.redcap = new REDCap();
        this.redcap.name = "";
        this.redcap.url = "";
        this.redcap.token = "";     
      }else{      
          //this.redcap = JSON.parse(getString("server"));
          this.redcap = JSON.parse(this.secureStorage.getSync({key: "server"}));
          this.activeREDCap = this.redcap.name;
          this.visibility = "visible";
      }

      if(ApplicationSettings.hasKey("Users")){
        this.users = JSON.parse(ApplicationSettings.getString("Users"));

        for (var i = 0, len = this.users.length; i < len; i++) {

          if(ApplicationSettings.hasKey("ActiveUser")){
            this.currentuser = JSON.parse(ApplicationSettings.getString("ActiveUser"));
            if(this.users[i].record_id == this.currentuser.record_id){
              this.users[i].active = true; 
            }
          }
           
        }

      }else{
        this.users =[];
      }
    }

    setWindow(record_id: string) {

      this.routerExtensions.navigate(["/window/" + record_id], {
      transition: {
          name: "fade",
          duration: 800,
          curve: "linear"
      }
      });

    }

    clearUsers() {
      ApplicationSettings.remove("Users");
      this.users =[];
    }
    
    refreshUsers() {

      this.itemService.getUsers().subscribe(
        fields => {

          let filtered_user = fields.filter((a) => a.uuid === Device.uuid );
          this.users =[];
          for (var i = 0, len = filtered_user.length; i < len; i++) {

            var _user = new UserModel();
            _user.record_id = filtered_user[i].record_id;
            _user.name = filtered_user[i].name;
            _user.uuid = filtered_user[i].uuid;
            _user.schedule =[];
            _user.active = false;
            this.users.push(_user);

           //this.users.push(new UserModel( filtered_user[i].record_id, filtered_user[i].name, filtered_user[i].uuid, false)); 
          }
          ApplicationSettings.setString("Users", JSON.stringify(this.users));

        }
      );
    }

    public onItemTap(args) {


        let prev_state = this.users[args.index].active;

        for (var i = 0, len = this.users.length; i < len; i++) {
           this.users[i].active = false; 
        }
        //this.users[args.index].active = true;
        this.users[args.index].active = !prev_state;
        this.users[args.index].schedule = [];
        //this.store.dispatch(UserActions.create_user(this.users[args.index]));

        ApplicationSettings.setString("ActiveUser", JSON.stringify(this.users[args.index]));
        ApplicationSettings.setString("UserChanged", "true");
        args.object.refresh();
    }

    saveUser() {
        let textview: TextView = <TextView>this.page.getViewById('txtUserName');
        //let _StudyID: TextView = <TextView>this.page.getViewById('txtStudyID');        


        if(textview.text.length > 0){
          this.saveRegistration(textview.text,textview);
        } else{

          dialogs.alert({
              title: "Error",
              message: "Please enter User/Child",
              okButtonText: "Close"
          });
        }
    }

    submit(args) {
        let textview: TextView = <TextView>args.object;

        if(textview.text.length > 0){
          this.saveRegistration(textview.text,textview);
        } else{

          dialogs.alert({
              title: "Error",
              message: "Please enter User/Child",
              okButtonText: "Close"
          });

        }
    }

    onSettings(args){

        dialogs.prompt({
        title: "Configuration",
        message: "Please enter your study code",
        okButtonText: "Done",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
        }).then(r => {

            if(r.result){
                this.http.get<any>(Config.server + "/iBehavior/Config/" + r.text ).subscribe(
                fields => {
                    //console.log(fields);
                    this.redcap.name = fields[0].NAME;
                    this.redcap.assessment_time = fields[1].ASSESSMENT_TIME;
                    this.redcap.url = fields[2].URL;
                    this.redcap.token = fields[3].TOKEN;
                    
                    //setString("server", JSON.stringify( this.redcap ));
                    const success = this.secureStorage.setSync({key: "server",value: JSON.stringify( this.redcap )});

                    this.redcap = JSON.parse(this.secureStorage.getSync({key: "server"}));
                    this.activeREDCap = this.redcap.name;
                    this.visibility = "visible";
                              
                },
                error => console.log(error.message));
            }
        });

    }

    saveRegistration(user: string, textview: TextView){

      this.itemService.getUsers().subscribe(
        users => {
          let filtered_user = users.filter((a) => a.uuid === Device.uuid );
          let existing_user = filtered_user.filter((a) => a.name === user );

          if(existing_user.length == 0){

            this.itemService.getRecordID().subscribe(
                fields => {

                  var record_id = 1;
                  if(fields.length == 0){
                      record_id = 1;
                  }else{
                      record_id = Math.max.apply(Math,fields.map(function(o){return o.record_id;})) + 1;
                  }

                  var new_user;

                  //if(studyID.length > 0){
                  //    new_user = JSON.parse( "{\"record_id\":\"" + studyID  + "\",\"name\":\"" + user + "\",\"uuid\":\"" + device.uuid + "\"}"  );
                  //}else{
                       new_user = JSON.parse( "{\"record_id\":\"" + record_id  + "\",\"name\":\"" + user + "\",\"uuid\":\"" + Device.uuid + "\"}"  );
                  //} 

                  var myPackage =[];
                  myPackage.push(new_user);

                  this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                      newUsers => {
                        if(newUsers.count == 1){
                          this.refreshUsers()
                          textview.text="";

                          // 2022-05-01 if phone number exists fill in xx_phones table.
                          if(ApplicationSettings.hasKey("phone_number")){

                              let register_phone = JSON.parse( "{\"record_id\":\"" + record_id + "\",\"phone\":\"" + ApplicationSettings.getString("phone_number") + "\",\"phone_uuid\":\"" + Device.uuid + "\"}"  );
                              //if( studyID.length > 0 ){
                              //  register_phone = JSON.parse( "{\"record_id\":\"" + studyID + "\",\"phone\":\"" + getString("phone_number") + "\",\"phone_uuid\":\"" + device.uuid + "\"}"  );
                              //}

                              var myPackage =[];
                              myPackage.push(register_phone);

                              this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                                  fields => {
                                      if(fields.count == 1){
                                          //console.log("phone registration updated");
                                      }
                                  }
                              );
                          }
                          // 2022-05-01  if phone number exists fill in xx_phones table.

                        }
                      }
                  );


                }
            );

          }else{
            alert("Observed person already exists.");
          }

        }
      );
      
    }

    getNextrecord_id(): Observable<any> {

      return this.itemService.getRecordID().pipe(map(
          fields => {

              if(fields.length == 0){
                  return 1;
              }else{
                  return Math.max.apply(Math,fields.map(function(o){return o.record_id;})) + 1;
              }
          }
      ));

    }

}
