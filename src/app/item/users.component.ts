import {Component, OnInit, Input, ChangeDetectionStrategy, Inject} from "@angular/core";
import { TextView } from "tns-core-modules/ui/text-view";
import { Switch } from "tns-core-modules/ui/switch";
import { RouterExtensions } from "nativescript-angular/router";
import * as LabelModule from "tns-core-modules/ui/label";
import {getString, setString, remove, hasKey} from "tns-core-modules/application-settings";
import { ItemService } from "./item.service";
import { device } from "tns-core-modules/platform";
import { Observable } from "rxjs/Observable";

import * as dialogs from "tns-core-modules/ui/dialogs";
import { HttpClient, HttpHeaders } from '@angular/common/http';
// import { Store } from 'redux';
// import { AppStore } from '../app.store';
// import { AppState } from '../app.state';
// import * as UserActions from '../user.actions';

import { UserModel } from './user';
import { Config } from "./config";
import { REDCap } from "./redcap";


import { Page } from 'tns-core-modules/ui/page';

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

    constructor(private page: Page, private itemService: ItemService, private http: HttpClient, private routerExtensions: RouterExtensions) { }

    ngOnInit(): void {

      if(!hasKey("server")){
        this.visibility = "hidden";
        this.redcap = new REDCap();
        this.redcap.name = "";
        this.redcap.url = "";
        this.redcap.token = "";     
      }else{
          this.redcap = JSON.parse(getString("server"));
          this.activeREDCap = this.redcap.name;
          this.visibility = "visible";
      }

      if(hasKey("Users")){
        this.users = JSON.parse(getString("Users"));

        for (var i = 0, len = this.users.length; i < len; i++) {

          if(hasKey("ActiveUser")){
            this.currentuser = JSON.parse(getString("ActiveUser"));
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
      remove("Users");
      this.users =[];
    }
    
    refreshUsers() {

      this.itemService.getUsers().subscribe(
        fields => {

          let filtered_user = fields.filter((a) => a.uuid === device.uuid );
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
          setString("Users", JSON.stringify(this.users));

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

        setString("ActiveUser", JSON.stringify(this.users[args.index]));

        args.object.refresh();
    }

    saveUser() {
        let textview: TextView = <TextView>this.page.getViewById('txtUserName');
        this.saveRegistration(textview.text, textview);
    }

    submit(args) {
        let textview: TextView = <TextView>args.object;
        this.saveRegistration(textview.text, textview);
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
                    

                    setString("server", JSON.stringify( this.redcap ));

                    this.redcap = JSON.parse(getString("server"));
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
          let filtered_user = users.filter((a) => a.uuid === device.uuid );
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

                  var new_user = JSON.parse( "{\"record_id\":\"" + record_id  + "\",\"name\":\"" + user + "\",\"uuid\":\"" + device.uuid + "\"}"  );
                  var myPackage =[];
                  myPackage.push(new_user);

                  this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                      newUsers => {
                        if(newUsers.count == 1){
                          this.refreshUsers()
                          textview.text="";
                        }
                      }
                  );


                }
            );

          }else{
            alert("User/Child already exists.");
          }

        }
      );
      
    }

    getNextrecord_id(): Observable<any> {

      return this.itemService.getRecordID().map(
          fields => {

              if(fields.length == 0){
                  return 1;
              }else{
                  return Math.max.apply(Math,fields.map(function(o){return o.record_id;})) + 1;
              }
          }
      );

    }

}
