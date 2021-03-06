/*
Copyright © CINES - Centre Informatique National pour l'Enseignement Supérieur (2020)

[dad@cines.fr]

This software is a computer program whose purpose is to provide
a web application to create, edit, import and export archive
profiles based on the french SEDA standard
(https://redirect.francearchives.fr/seda/).


This software is governed by the CeCILL-C  license under French law and
abiding by the rules of distribution of free software.  You can  use,
modify and/ or redistribute the software under the terms of the CeCILL-C
license as circulated by CEA, CNRS and INRIA at the following URL
"http://www.cecill.info".

As a counterpart to the access to the source code and  rights to copy,
modify and redistribute granted by the license, users are provided only
with a limited warranty  and the software's author,  the holder of the
economic rights,  and the successive licensors  have only  limited
liability.

In this respect, the user's attention is drawn to the risks associated
with loading,  using,  modifying and/or developing or reproducing the
software by the user in light of its specific status of free software,
that may mean  that it is complicated to manipulate,  and  that  also
therefore means  that it is reserved for developers  and  experienced
professionals having in-depth computer knowledge. Users are therefore
encouraged to load and test the software's suitability as regards their
requirements in conditions enabling the security of their systems and/or
data to be ensured and,  more generally, to use and operate it in the
same conditions as regards security.

The fact that you are presently reading this means that you have had
knowledge of the CeCILL-C license and that you accept its terms.
*/
import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {CdkTextareaAutosize} from '@angular/cdk/text-field';
import {ActivatedRoute} from '@angular/router';
import {ToggleSidenavService} from '../core/services/toggle-sidenav.service';
import {ToastContainerDirective, ToastrService} from 'ngx-toastr';
import {Subscription} from 'rxjs';
import {EditProfileComponent} from '../profile/edit-profile/edit-profile.component';
import {FileNode, FileNodeInsertAttributeParams, FileNodeInsertParams} from "../profile/edit-profile/classes/file-node";

@Component({
  selector: 'app-home',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {


  @ViewChild('treeSelector', { static: true }) tree: any;
  @ViewChild('autosize', { static: false }) autosize: CdkTextareaAutosize;
  @ViewChild(ToastContainerDirective, { static: true })
  toastContainer: ToastContainerDirective;
  @ViewChild(EditProfileComponent)
  editProfileComponent: EditProfileComponent;

  opened: boolean;
  events: string[] = [];
  profileId: number;
  noticeDisplay: boolean;
  noticeDisplaySub: Subscription;

  constructor(private route: ActivatedRoute,private sideNavService : ToggleSidenavService, private toastrService: ToastrService) {

    this.sideNavService.isOpened.subscribe(status=>{
      this.opened = status;
    })
    this.noticeDisplaySub = this.sideNavService.noticeSelected.subscribe(statusNotice => {
      this.noticeDisplay = statusNotice;
      console.log('consolee ======> status'+ this.noticeDisplay)
    })
  }

  ngOnInit() {
    this.toastrService.overlayContainer = this.toastContainer;
    this.route.params.subscribe(params => {
      this.profileId = params['id']
    });

  }

  openSideNav(){
    this.opened = true;
  }

  closeSideNav(){
    this.opened = false;
  }

  insertionItem($event: FileNodeInsertParams) {
    this.editProfileComponent.fileTreeComponent.insertItem($event.node, $event.elementsToAdd);
    console.log("Params : ", $event);
  }

  addNode($event: FileNode) {
    this.editProfileComponent.fileTreeComponent.addNewItem($event);

  }

  insertAttribute($event: FileNodeInsertAttributeParams) {
    console.log("Params in attributes : ", $event);
    this.editProfileComponent.fileTreeComponent.insertAttributes($event.node, $event.elementsToAdd);
  }

  removeNode($event: FileNode) {
    this.editProfileComponent.fileTreeComponent.remove($event);
  }

  ngOnDestroy(): void {
    this.noticeDisplaySub.unsubscribe();
  }
}
