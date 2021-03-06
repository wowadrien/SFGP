import { Component, ViewChild } from '@angular/core';

import { ActionSheet, ActionSheetController, AlertController, App, ItemSliding, List, ModalController, NavController, LoadingController, ToastController } from 'ionic-angular';

import { Storage } from '@ionic/storage';

import { BarcodeScanner, BarcodeScannerOptions } from '@ionic-native/barcode-scanner'

import { InAppBrowser } from '@ionic-native/in-app-browser';

/*
  To learn how to use third party libs in an
  Ionic app check out our docs here: http://ionicframework.com/docs/v2/resources/third-party-libs/
*/
// import moment from 'moment';

import { ConferenceData } from '../../providers/conference-data';
import { UserData } from '../../providers/user-data';

import { SessionDetailPage } from '../session-detail/session-detail';
import { ScheduleFilterPage } from '../schedule-filter/schedule-filter';

declare var firebase :any;

@Component({
  selector: 'page-schedule',
  templateUrl: 'schedule.html'
})
export class SchedulePage {
  // the list is a child of the schedule page
  // @ViewChild('scheduleList') gets a reference to the list
  // with the variable #scheduleList, `read: List` tells it to return
  // the List and not a reference to the element
  @ViewChild('scheduleList', { read: List }) scheduleList: List;
  actionSheet: ActionSheet;
  options: BarcodeScannerOptions;
  
  dayIndex = 0;
  roomIndex: any = 0;
  queryText = '';
  segment = 'all';
  excludeTracks: any = [];
  shownSessions: any = [];
  groups: any = [];
  confDate: string;
  favorite: boolean;
  vote: any;
  users:Array<Object> ;
  _db: any;
  buttonclass:string = 's1';
  segbuttonclass = 'j1';

  constructor(
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public app: App,
    public loadingCtrl: LoadingController,
    public modalCtrl: ModalController,
    public navCtrl: NavController,
    public confData: ConferenceData,
    public user: UserData,
    private barcode: BarcodeScanner,
    public actionSheetCtrl: ActionSheetController,
    public storage : Storage,
    private iab: InAppBrowser
  ) {
     this.users=[]; 
     this._db = firebase.database().ref('/vote/');
      this._db.on('value', (dataSnapshot:any) => {
        dataSnapshot.forEach((childSnapshot:any) => {
          this.users.push(childSnapshot.val());
        });
      });
  }

  ionViewDidLoad() {
    this.app.setTitle('Schedule');
    this.updateSchedule();
    //this.storage.remove('Mes favoris');
  }

  open(site :any){
    this.iab.create(site, '_system', 'location=yes');
  }
  
  updateSchedule() {
    // Close any open sliding items when the schedule updates
    this.scheduleList && this.scheduleList.closeSlidingItems();

    this.confData.getTimeline(this.dayIndex, this.roomIndex, this.queryText, this.excludeTracks, this.segment).subscribe((data: any) => {
      this.shownSessions = data.shownSessions;
      this.groups = data.groups;      
    });    
  }
  
    async scanBarcode(){
      const results = await this.barcode.scan();
      let alert = this.alertCtrl.create({
        title: 'Que voulez vous faire avec ce poster ?\n',
        buttons: [
        {
          text: 'Voter pour ce poster',
          handler:() =>{
            this.storage.get('avoter').then((data) =>{
            if(data != true){
            this._db.push({'title': results.text });
            this.storage.set ('avoter', true);
            let toast= this.toastCtrl.create({
              message: 'Votre vote a bien été enregistré.',
              duration: 3000
            });
            toast.present();
            }
            else
            {
            let toast= this.toastCtrl.create({
              message: 'Vote non pris en compte, vous avez déjà voté !',
              duration: 3000
            });
            toast.present();
            }
          });
          }
          },
        { 
          text: 'Voir ce poster en ligne',
          handler:() =>{
            open(results.text);
          }
        },
        {
          text: 'Quitter'
          }]
      });
      alert.present();      
  }  
  
  changeDayIndex(index: any){
    this.dayIndex = index;
    this.updateSchedule();
  }
  
  changeRoomIndex(place:any){
    this.roomIndex = place;
    this.updateSchedule();
  }
  
  presentFilter() {
    let modal = this.modalCtrl.create(ScheduleFilterPage, this.excludeTracks);
    modal.present();

    modal.onWillDismiss((data: any[]) => {
      if (data) {
        this.excludeTracks = data;
        this.updateSchedule();
      }
    });

  }

  goToSessionDetail(sessionData: any) {
    // go to the session detail page
    // and pass in the session data
    this.navCtrl.push(SessionDetailPage, { 
      name: sessionData.name,
      session: sessionData
    });
  }
  
  addFavorite(slidingItem: ItemSliding, sessionData: any) {

    if (this.user.hasFavorite(sessionData.name)) {
      // woops, they already favorited it! What shall we do!?
      // prompt them to remove it
      this.removeFavorite(slidingItem, sessionData, 'Cette session est déjà dans vos Favoris');
    } else {
      // remember this session as a user favorite
      this.user.addFavorite(sessionData.name);
     // this.storage.set('Mes favoris', sessionData.name)

      // create an alert instance
      let alert = this.alertCtrl.create({
        title: 'Favori ajouté',
        buttons: [{
          text: 'OK',
          handler: () => {
            // close the sliding item
            slidingItem.close();
          }
        }]
      });
      // now present the alert on top of all other content
      alert.present();
      
    }
    /*if(this.storage.get('Mes favoris') != null){
      this.storage.get('Mes favoris').then((val) => {
        console.log('val avant + fav :'+val);
        this.storage.set('Mes favoris', val).then((fav) => {
          val = val + fav;
          console.log('val après :'+val);
          });
        }); 
    }else{
    }
    this.favorite = true;*/
    this.storage.get('Mes favoris').then((data) => {
      if(data != null)
      {
        data.push(sessionData.id);
        this.storage.set('Mes favoris', data);
      }
      else
      {
        let array = [];
        array.push(sessionData.name);
        this.storage.set('Mes favoris', array);
      }
    });

  }

  removeFavorite(slidingItem: ItemSliding, sessionData: any, title: string) {
    let alert = this.alertCtrl.create({
      title: 'Retirer des Favoris',
      message: 'Voulez-vous retirer cette session de vos favoris ?',
      buttons: [
        {
          text: 'Annuler',
          handler: () => {
            // they clicked the cancel button, do not remove the session
            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        },
        {
          text: 'Retirer',
          handler: () => {
            // they want to remove this session from their favorites
            this.user.removeFavorite(sessionData.name);
            this.updateSchedule();

            // close the sliding item and hide the option buttons
            slidingItem.close();
          }
        }
      ]
    });
    // now present the alert on top of all other content
    alert.present();
    /*let i = index;
    this.storage.get('Mes favoris').then((data) => {
      if(data != null)
      {
        this.storage.remove(data[i]);
        data.push(sessionData.name);
        this.storage.set('Mes favoris', data);
      }
      else
      {
        let array = [];
        array.push(sessionData.name);
        this.storage.set('Mes favoris', array);
      }
    });*/
  }
}
