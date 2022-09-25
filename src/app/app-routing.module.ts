import { NgModule } from '@angular/core'
import { Routes } from '@angular/router'
import { NativeScriptRouterModule } from '@nativescript/angular'

import { ItemsComponent } from './forms/items.component'
import { ItemDetailComponent } from './formdetails/item-detail.component'
import { ItemDetail2Component } from './formdetails2/item-detail2.component'
import { SituationComponent } from "./situation/situation.component";
import { SplashScreenComponent } from "./splashscreen/splashscreen.component";
import { CacheDataComponent } from "./cachedata/cachedata.component";
import { UsersComponent } from "./users/users.component";

const routes: Routes = [
  { path: "", redirectTo: "/splashscreen", pathMatch: "full" },
  { path: "splashscreen", component: SplashScreenComponent },
  { path: "forms", component: ItemsComponent },
  { path: "form/:form_name", component: ItemDetailComponent },
  { path: "form/:form_name/:position", component: ItemDetailComponent }, 
  { path: "form2/:form_name", component: ItemDetail2Component },
  { path: "form2/:form_name/:position", component: ItemDetail2Component },   
  { path: "situation", component: SituationComponent },
  { path: 'item/:id', component: ItemDetailComponent },
  { path: "cachedata", component: CacheDataComponent },
  { path: "users", component: UsersComponent },
]

@NgModule({
  imports: [NativeScriptRouterModule.forRoot(routes)],
  exports: [NativeScriptRouterModule],
})
export class AppRoutingModule {}
