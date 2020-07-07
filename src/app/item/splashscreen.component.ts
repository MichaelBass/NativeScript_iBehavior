import { Component, OnInit, DoCheck} from "@angular/core";
import {Router} from "@angular/router";
import {RouterExtensions} from "nativescript-angular/router";
import { ItemService } from "./item.service";
import { CacheService } from "./cache.service";
import { getString, setString, hasKey} from "tns-core-modules/application-settings";
import * as connectivity from "tns-core-modules/connectivity";
import { isAndroid, isIOS, device, screen } from "tns-core-modules/platform";
//const platformModule = require("tns-core-modules/platform");
import * as dialogs from "tns-core-modules/ui/dialogs";
import { Config } from "./config";
import { REDCap } from "./redcap";
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { UserModel } from './user';
import { Observable } from "rxjs/Observable";

import { EventData } from "tns-core-modules/data/observable";

@Component({
    selector: "ns-splashscreen",
    moduleId: module.id,
    templateUrl: "./splashscreen.component.html",
    styleUrls:["./splashscreen-common.css","./splashscreen.css"]
})
export class SplashScreenComponent implements OnInit, DoCheck{
    
    instructions: string;
    server: string;

    redcap: REDCap;
    redcapColor: string;
    activeREDCap: string;

    user : UserModel;
    userColor : string;
    activeuser: string;
    currentUser: string;

    constructor(private itemService: ItemService, private router: Router, private http: HttpClient, private cacheService: CacheService, private routerExtensions: RouterExtensions) {

    }

    ngDoCheck(): void {
        this.instructions = "Welcome to iBehavior \r "; //, there are a few things that you need to do before we begin:"


        if(!hasKey("server")){
            this.server = ""; // "You will need to specify where your data will be sent. Click on the Settings and click the Download button to enter the study code that you were provided.  If you do not have a study code enter 'test'."
            this.redcapColor = "red";
            
        }else{
            this.server = "";
            this.redcap = JSON.parse(getString("server"));
            this.redcapColor = "green";
            this.activeREDCap = this.redcap.name;
        }

        if(!hasKey("ActiveUser")){
            this.activeuser = ""; // "You will need to set a user as active. Click on the Mange User and either create or select an user and make him/her active."
            this.userColor = "red";
        }else{
            this.activeuser = "";
            this.user = JSON.parse(getString("ActiveUser"));
            this.currentUser = this.user.name;
            this.userColor = "green";
        }

    }

    ngOnInit(): void {

        this.redcap = new REDCap();
        this.redcap.name = "";
        this.redcap.url = "";
        this.redcap.token = "";
    }

    onResetCache(args){
        this.cacheService.resetCache();
    }

    onViewCache(args){
        let options = {
            title: "cache",
            message: getString("cacheResponse"),
            okButtonText: "OK"
        };
        alert(options);
    }

    onHelp(args){

        var _user = "";
        if(hasKey("ActiveUser")){
            _user = "\r[user:: " + this.currentUser + "]";
        }

        var _db = "";
        if(hasKey("server")){
            _db = "\r[study code:: " + this.redcap.name + "]";
        }

        var _version = "\riOS::1.0.10  android::1.0 24";



        if(! hasKey("cacheResponse") ){
            setString("cacheResponse", "[]");
        }

        var myCache = JSON.parse(getString("cacheResponse"));
        var cacheLength = 0;
        if(myCache){
            cacheLength = myCache.length;
        }
        var _cache = "\r cached data:: " + cacheLength + " records";


        var _connectivity = "";
        let connectionType = connectivity.getConnectionType();
        switch (connectionType) {
            case connectivity.connectionType.none:
                //console.log("connectionType: None");
                _connectivity = "\rConnectivity::None";
                break;
            case connectivity.connectionType.wifi:
                //console.log("connectionType: Wi-Fi");
                _connectivity = "\rConnectivity::Wi-Fi";
                break;
            case connectivity.connectionType.mobile:
                //console.log("connectionType: Mobile");
                _connectivity = "\rConnectivity::Mobile";
                break;
            default:
                //console.log("connectionType: default?");
                break;
        }

        // dialogs.action("More information coming soon." + _user + _db + _version + _connectivity + _cache, "Close", ["Clear cache", "View cache", "Register Phone", "Transfer Users"]).then(result => {
        dialogs.action("More information coming soon." + _user + _db + _connectivity + _cache, "Close", ["Clear cache", "View cache", "Register Phone", "Transfer Users"]).then(result => {
            if(result == "Clear cache"){
                this.cacheService.resetCache();
            }
            if(result == "Register Phone"){
                this.registerPhone();
            }
             if(result == "Transfer Users"){
                this.transferUsers();
            }
            if(result == "View cache"){

                this.routerExtensions.navigate(["/cachedata"], {
                transition: {
                    name: "fade",
                    duration: 800,
                    curve: "linear"
                }
                });

            }
        });

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
                },
                error => console.log(error.message));
            }
        });

    }

    transferUsers(){
        dialogs.prompt({
        title: "Transfer Users",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
        // message: "Please enter your phone number \r(xxx) xxx-xxxx",
        okButtonText: "Done",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
        }).then(r => {

            if(r.result){
                var phoneRegex = /^[0-9]{10}$/;
                // var phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
                if( !phoneRegex.test(r.text) ){
                   // alert("User format (xxx) xxx-xxxx");
                    alert("Please enter only 10 digits");
                    return;
                }

                let formatted_number = "(" + r.text.substring(0,3) + ") " + r.text.substring(3,6) + "-" + r.text.substring(6) ;

                this.itemService.getPhones(formatted_number).subscribe(
                    record => {
                        if(record.length > 0 ){
                            this.itemService.getDevice(formatted_number).subscribe(
                                record => {
                                    if(record.length > 0 ){

                                        this.itemService.getUsersByDevice(record[0].phone_uuid).subscribe(
                                            users =>{
                                                 //var counter = 0;
                                                 for(var i = 0; i < users.length; i++){
                                                
                                                    var update_User = JSON.parse( "{\"record_id\":\"" + users[i].record_id + "\",\"uuid\":\"" + device.uuid + "\"}"  );

                                                    var myPackage =[];
                                                    myPackage.push(update_User);

                                                    if( users[i].uuid != device.uuid ){
                                                        this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                                                            fields => {
                                                                if(fields.count == 1){
                                                                 //counter = counter + 1;
                                                                }
                                                            }
                                                        );
                                                    }

                                                 }
                                                 alert(users.length + " users transfered."); 
                                            }

                                        );
                                    }
                                }
                            );
                        } 
                    }
                );

            }
        });

    }

    registerPhone(){

        dialogs.prompt({
        title: "Register Phone",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
        //message: "Please enter your phone number \r(xxx) xxx-xxxx",
        okButtonText: "Done",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
        }).then(r => {

            if(r.result){

                var phoneRegex = /^[0-9]{10}$/;
                //var phoneRegex = /^\([0-9]{3}\) [0-9]{3}-[0-9]{4}$/;
                if( !phoneRegex.test(r.text) ){
                    //alert("Use format (xxx) xxx-xxxx");
                    alert("Please enter only 10 digits");
                    return;
                } 

                let formatted_number = "(" + r.text.substring(0,3) + ") " + r.text.substring(3,6) + "-" + r.text.substring(6) ;


                this.itemService.getDevicePhoneNumber(device.uuid).subscribe(
                //this.itemService.getPhones(formatted_number).subscribe(
                    record => {
                        if(record.length > 0 ){
                            var update_registration = JSON.parse( "{\"record_id\":\"" + record[0].record_id + "\",\"phone\":\"" + formatted_number + "\",\"phone_uuid\":\"" + device.uuid + "\"}"  );

                            var myPackage =[];
                            myPackage.push(update_registration);

                            this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                                fields => {
                                    if(fields.count == 1){
                                        alert("phone registration updated");
                                    }
                                }
                            );
                        } else{

                            this.itemService.getRecordID().subscribe(
                                fields => {

                                    var record_id = 1;
                                    if(fields.length == 0){
                                        record_id = 1;
                                    }else{
                                        record_id = Math.max.apply(Math,fields.map(function(o){return o.record_id;})) + 1;
                                    }

                                    var new_registration = JSON.parse( "{\"record_id\":\"" + record_id + "\",\"phone\":\"" + formatted_number + "\",\"phone_uuid\":\"" + device.uuid + "\"}"  );
                                    var myPackage =[];
                                    myPackage.push(new_registration);

                                    this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                                        phones => {
                                            if(phones.count == 1){
                                                alert("phone has been registered");
                                            }
                                        }
                                    );
                                }
                            );

                        }
                    }
                );

            }
        });

    }
}