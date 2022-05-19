import { Component, OnInit, Input, Inject, ViewChild, ElementRef} from "@angular/core";

import { ApplicationSettings, EventData, Button } from '@nativescript/core';

import { Studyform } from '../model/studyform';
import { DataStructure } from '../model/datastructure';
import { UserModel } from '../model/user';
import { LooseObject } from '../model/looseobject';

import { ItemService } from "../server/item.service";
import { CacheService } from "../server/cache.service";

import { Observable} from "rxjs";  

@Component({
    selector: "ns-cachedata",
    moduleId: module.id,
    templateUrl: "./cachedata.component.html",
    styleUrls:["./cachedata.css"]
})


export class CacheDataComponent implements OnInit {

    @ViewChild("content", { static: false }) contentView: ElementRef;

    data: DataStructure[];
    user : UserModel;
    forms: Array<Studyform> = [];

    constructor(private itemService: ItemService, private cacheService: CacheService) { }

    ngOnInit(): void {

        if(ApplicationSettings.hasKey("ActiveUser")){
           this.user = JSON.parse(ApplicationSettings.getString("ActiveUser"));
        }

        if(ApplicationSettings.hasKey("studyForms")){
            this.forms = JSON.parse(ApplicationSettings.getString("studyForms"));
        }

        this.getData();
    }

    saveCacheData(args: EventData){
        let button = <Button>args.object;
    
        let myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));
        let _foundData = myPackage.find( function (obj){
           return button.id === obj.record_id + obj.redcap_repeat_instrument + obj.redcap_repeat_instance
        });

        if (typeof _foundData  !== 'undefined'){
            
            this.cacheService.uploadCachedData(_foundData).subscribe(
                () => {
                    this.getData();
                    this.contentView.nativeElement.refresh();
                }
            );
        }
    }

    getData(): void {

        this.data = [];

        let myPackage = JSON.parse(ApplicationSettings.getString("cacheResponse"));
        for(var i=0; i < myPackage.length; i++){
            let assessment = new DataStructure();
            assessment.record_id = myPackage[i].record_id;
            assessment.redcap_repeat_instrument = myPackage[i].redcap_repeat_instrument;
            assessment.redcap_repeat_instance = myPackage[i].redcap_repeat_instance;
            assessment.results = [];
            for (var key in myPackage[i]) {
                if (myPackage[i].hasOwnProperty(key)) {
                    var obj = new LooseObject;
                    obj.key = key;
                    obj.value = myPackage[i][key];
                    assessment.results.push(obj);
                }
            }

            this.data.push(assessment)

        }

    }

}
