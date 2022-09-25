import { Component, OnInit } from "@angular/core";
import { ModalDialogParams } from "@nativescript/angular";
import { LooseObject } from '../model/looseobject';
import { Page } from '@nativescript/core';


@Component({
    selector: "my-hint",
    moduleId: module.id,
    templateUrl: "./hints.component.html",
    styleUrls:["./hints.css"]
})
export class HintComponent implements OnInit {


    //  need to change template and style for ios by changing path to ./item/hint.html, etc.
	public hints: Array<LooseObject>;
    public title: string;
    public ratingHelp: string;

    private answer: string;

    public constructor(private params: ModalDialogParams, private page: Page) { 
    	this.hints = params.context.code;
        this.title = params.context.title;
        this.ratingHelp = params.context.ratingHelp;
    }

    ngOnInit(): void { 
       // var lv = this.page.getViewById("content");   
       // lv.android.setFastScrollAlwaysVisible(true);
    }

    onSelectResponse(args){
        this.answer = args;
        this.params.closeCallback(this.answer);
    }

    public close(){
        this.params.closeCallback("");
    };
    
    /*
    public close(res: string) {
        if(typeof res == 'undefined'){
            this.answer="";
        }
        this.params.closeCallback(this.answer);
    }
    */
    
}