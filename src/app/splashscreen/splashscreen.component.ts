import { Component, OnInit, DoCheck} from "@angular/core";
import {Router} from "@angular/router";
import { HttpClient, HttpHeaders } from '@angular/common/http';

import {RouterExtensions} from "@nativescript/angular";
import { ApplicationSettings } from '@nativescript/core';
import * as connectivity from '@nativescript/core/connectivity';
import { Device } from '@nativescript/core';
import * as dialogs from '@nativescript/core/ui/dialogs';

import { Config } from "../model/config";
import { REDCap } from "../model/redcap";
import { UserModel } from '../model/user';

import { ItemService } from "../server/item.service";
import { CacheService } from "../server/cache.service";

import { Observable} from "rxjs";

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

        if(this.itemService.getServer() === null ){
            this.server = ""; // "You will need to specify where your data will be sent. Click on the Settings and click the Download button to enter the study code that you were provided.  If you do not have a study code enter 'test'."
            this.redcapColor = "red";  
        }else{
            this.server = "";
            this.redcap = this.itemService.getServer();
            this.redcapColor = "green";
            this.activeREDCap = this.redcap.name;
        }

        if(!ApplicationSettings.hasKey("ActiveUser")){
            this.activeuser = ""; // "You will need to set a user as active. Click on the Mange User and either create or select an user and make him/her active."
            this.userColor = "red";
        }else{
            this.activeuser = "";
            this.user = JSON.parse(ApplicationSettings.getString("ActiveUser"));
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
            message: ApplicationSettings.getString("cacheResponse"),
            okButtonText: "OK"
        };
        alert(options);
    }

    onHelp(args){

        let _user = "";
        if(ApplicationSettings.hasKey("ActiveUser")){
            _user = "\r[user:: " + this.currentUser + "]";
        }

        let _db = "";
        if( this.itemService.getServer() != null ){
            _db = "\r[study code:: " + this.redcap.name + "]";
        }

        let _version = "\riOS::1.0.21  android::1.0 32";



        if(! ApplicationSettings.hasKey("cacheResponse") ){
            ApplicationSettings.setString("cacheResponse", "[]");
        }

        let myCache = JSON.parse(ApplicationSettings.getString("cacheResponse"));
        let cacheLength = 0;
        if(myCache){
            cacheLength = myCache.length;
        }
        let _cache = "\r cached data:: " + cacheLength + " records";


        let _connectivity = "";
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

                    //setString("server", JSON.stringify( this.redcap ));
                    const success = this.itemService.setServer(this.redcap);
                },
                error => console.log(error.message));
            }
        });

    }

    transferUsers(){
        dialogs.prompt({
        title: "Transfer Users",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
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
                ApplicationSettings.setString("phone_number", formatted_number);
                
                this.itemService.getDevices(formatted_number).subscribe(
                    records => {
                        let myPackage =[];
                        for(var i = 0; i < records.length; i++){
                            var update_uuid = JSON.parse( "{\"record_id\":\"" + records[i].record_id + "\",\"uuid\":\"" + Device.uuid + "\",\"phone_uuid\":\"" + Device.uuid + "\"}");
                            myPackage.push(update_uuid);
                        }
                        this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                            fields => {
                                alert(fields.count + " users transfered.");
                            }
                        );    
                    }
                );
            } 
        });
    }

    registerPhone(){
        dialogs.prompt({
        title: "Register Phone",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
        okButtonText: "Done",
        cancelButtonText: "Cancel",
        inputType: dialogs.inputType.text
        }).then(r => {

            if(r.result){
                var phoneRegex = /^[0-9]{10}$/;
                if( !phoneRegex.test(r.text) ){
                    alert("Please enter only 10 digits");
                    return;
                }

                let formatted_number = "(" + r.text.substring(0,3) + ") " + r.text.substring(3,6) + "-" + r.text.substring(6) ;
                ApplicationSettings.setString("phone_number", formatted_number);
                
                this.itemService.getDevicePhoneNumber(Device.uuid).subscribe(
                    records => {
                        let myPackage =[];
                        for(var i = 0; i < records.length; i++){
                            var update_uuid = JSON.parse( "{\"record_id\":\"" + records[i].record_id + "\",\"phone\":\"" + formatted_number + "\",\"phone_uuid\":\"" + Device.uuid + "\"}");
                            myPackage.push(update_uuid);
                        }
                        this.itemService.saveData( JSON.stringify(myPackage) ).subscribe(
                            fields => {
                                alert(fields.count + " users assigned phone number.");
                            }
                        );    
                    }
                );
            } 
        });
    }

    registerPhone_old(){

        dialogs.prompt({
        title: "Register Phone",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
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
            ApplicationSettings.setString("phone_number", formatted_number);
            }
        });

    }

        transferUsers_old(){
        dialogs.prompt({
        title: "Transfer Users",
        message: "Please enter your 10 digit phone number (no space/hyphen)",
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
                ApplicationSettings.setString("phone_number", formatted_number);
                
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
                                                
                                                    var update_User = JSON.parse( "{\"record_id\":\"" + users[i].record_id + "\",\"uuid\":\"" + Device.uuid + "\"}"  );

                                                    var myPackage =[];
                                                    myPackage.push(update_User);

                                                    if( users[i].uuid != Device.uuid ){
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
}