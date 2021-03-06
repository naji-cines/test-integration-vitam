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
import {Injectable} from '@angular/core';
import {MatDialog} from '@angular/material/dialog';
import {BehaviorSubject, Observable} from 'rxjs';
import {SedaCardinalityConstants, SedaData, SedaElementConstants} from '../../profile/edit-profile/classes/seda-data';
import {FileNode, TypeConstants} from '../../profile/edit-profile/classes/file-node';
import {PastisDialogConfirmComponent} from '../../shared/pastis-dialog/pastis-dialog-confirm/pastis-dialog-confirm.component';
import {ProfileService} from './profile.service';
import {PastisDialogData} from 'projects/pastis/src/app/shared/pastis-dialog/classes/pastis-dialog-data';
import {SedaService} from './seda.service';
import {FileTreeMetadataService} from '../../profile/edit-profile/file-tree-metadata/file-tree-metadata.service';
import {PuaService} from './pua.service';
import {ComponentType} from '@angular/cdk/portal';

@Injectable({
  providedIn: 'root'
})

export class FileService  {

  dataChange = new BehaviorSubject<FileNode[]>([]);
  profile = new BehaviorSubject<any>([]);
  notice = new BehaviorSubject<any>([]);
  nodeChange = new BehaviorSubject<FileNode>(null);
  allData = new BehaviorSubject<FileNode[]>([]);

  collectionName = new BehaviorSubject<string>(null);
  rootTabMetadataName = new BehaviorSubject<string>(null);


  filteredNode = new BehaviorSubject<FileNode>(null);
  tabChildrenRulesChange = new BehaviorSubject<string[][]>([]);



  parentNodeMap = new Map<FileNode, FileNode>();

  constructor(private profileService: ProfileService,  private fileMetadataService: FileTreeMetadataService,
    private dialog: MatDialog, private sedaService: SedaService, private puaService : PuaService) { }

  getCurrentFileTree(): Observable<FileNode[]> {
      console.log("On file service : ", this.dataChange.getValue())
      return this.dataChange;
  }

  reinitialisaDataChange() {
    this.dataChange = new BehaviorSubject<FileNode[]>([]);
  }

  addSedaMetadataToFileTree(id:number){
    this.profileService.getProfile(id).subscribe((response) => {
      this.profile.next(response);
      let profile = this.puaService.puaToFileNode(response);
      this.sedaService.getSedaRules().subscribe((sedaData: any) => {
        let sedaDataArray: SedaData[] = [sedaData[0]];
        this.linkFileNodeToSedaData(null, profile, sedaDataArray);
        this.dataChange.next(profile);
      })
      if(response.notice){
        this.notice.next(JSON.parse(response.notice));
      }
    });
  return this.dataChange;
  }

  addSedaMetadataFromFileToFileTree(noSedaProfile:any){
      this.sedaService.getSedaRules().subscribe((sedaData: any) => {
        let sedaDataArray: SedaData[] = [sedaData[0]];
        this.linkFileNodeToSedaData(null, noSedaProfile, sedaDataArray);
        this.dataChange.next(noSedaProfile);
      })

  return this.dataChange;
  }



  sedaDataArchiveUnit : SedaData;

  /**
   * Relie chaque FileNode a sa définition Seda
   *
   * Les nodes correspondant aux ArchivesUnit
   * se réfèrent à la définition SEDA de l'ArchiveUnit mère (ils sont récursifs...)
   * @param parent
   * @param nodes
   * @param sedaData
   */
  linkFileNodeToSedaData(parent: FileNode, nodes: FileNode[], sedaData: SedaData[]){
    Array.prototype.forEach.call(nodes, (node: FileNode) => {
      node.parent = parent;
      let nodeName : string = (node.name === 'xml:id') ? 'id' : node.name;
      let sedaDataMatch: SedaData;

      // Si le node en cours est une ArchiveUnit, lui même enfant d'une ArchiveUnit...
      if (nodeName === 'ArchiveUnit' && this.sedaDataArchiveUnit != undefined) {
        // Alors on utilise la définition SEDA de l'ArchiveUnit mère..
        sedaDataMatch = this.sedaDataArchiveUnit;
      } else {
        // Sinon on recherche la définition SEDA dans l'arbre
        sedaDataMatch = sedaData.find(seda => seda.Name === nodeName);
        //sedaDataMatch = this.sedaService.getSedaNodeRecursively(sedaData[0],nodeName)
      }
      if (!sedaDataMatch){
        // Sometimes,the sedaData has no property children, but many symblins (e.g. elements on the same level of the tree)
        // In this case, the recursivity must be used on each symbling since the service getSedaNodeRecursively
        // expects a tree root element with Children key
        for (const element of sedaData) {
          let resultRecursity = this.sedaService.getSedaNodeRecursively(element,nodeName);
          if (resultRecursity) {
            console.error("Found result : ", resultRecursity);
            sedaDataMatch = resultRecursity;
            break;
          }
        }

      } else {
        // Si le node en cours est l'achive ArchiveUnit mère, on la sauvegarde pour l'utiliser pour les ArchivesUnit enfants
        if (sedaDataMatch.Name === 'ArchiveUnit' && this.sedaDataArchiveUnit == undefined){
          this.sedaDataArchiveUnit = sedaDataMatch;
          // On introduit la récursivité sur les ArchivesUnit
          this.sedaDataArchiveUnit.Children.find((c: { Name: string; })=>c.Name=='ArchiveUnit').Children = this.sedaDataArchiveUnit.Children;
        }
      }
      node.sedaData = sedaDataMatch;
      if (node.children.length > 0){
        this.linkFileNodeToSedaData(node, node.children,node.sedaData.Children);
      }
    });
  }

  updateFileTree(newData: FileNode[]): Observable<FileNode[]> {
    this.sedaService.getSedaRules().subscribe((sedaData) => {
      let sedaDataArray: SedaData[] = [sedaData[0]];
      this.linkFileNodeToSedaData(null, newData, sedaDataArray);
      this.dataChange.next(newData);
    })
    return this.dataChange;
  }

    /**
    * Update the children of a node, based on given list of nodes
    * @param parentNode
    * @param newChildrenNodes
    */
  updateNodeChildren(parentNode: FileNode, newChildrenNodes:FileNode[]) {
    for (let idx in parentNode.children) {
      let childFromNewChildren = newChildrenNodes.find(newChild => newChild.id == parentNode.children[idx].id);
      if (childFromNewChildren) {
        parentNode.children[idx] = childFromNewChildren;
      }
    }
  }

  sendNode(node:FileNode) {
    this.nodeChange.next(node);
    console.log("Node on file file service : ", this.nodeChange.getValue());
  }

  openPopup(popData: PastisDialogData){
    const dialogConfirmRef = this.dialog.open(PastisDialogConfirmComponent, {
      width: popData.width,
      height: popData.height,
      data: popData,
      panelClass: 'pastis-popup-modal-box'
    });
    return new Promise((resolve, reject) => {
      dialogConfirmRef.afterClosed().subscribe(data => {
        resolve(data);
        console.log("The confirm dialog was closed with data : ", data);
      }, reject)
    });
  }

  findChild(nodeName:string,node:FileNode):FileNode {
    if (nodeName === node.name) return node;
    for (let child of node.children) {
      if (child.name === nodeName){
        return child;
      }
    }
  }

  findChildById(nodeId:Number,node:FileNode):FileNode {
    if (nodeId === node.id) return node;
    for (let child of node.children) {
      if (child.id === nodeId){
        return child;
      }
    }
  }

  setCollectionName(collectionName:string){
    this.collectionName.next(collectionName);
  }

  setTabRootMetadataName(rootTabMetadataName:string){
    this.rootTabMetadataName.next(rootTabMetadataName);
  }


  openDialogWithTemplateRef(templateRef: ComponentType<unknown>) {
    this.dialog.open(templateRef);
  }

  setNewChildrenRules(rules:string[][]){
      this.tabChildrenRulesChange.next(rules);
  }

  /**
   * Get one attribute of the node by its name
   * @param fileNode The concerned node
   * @param attributeName The name of the attribute we want to get
   */
  getAttributeByName(fileNode:FileNode, attributeName:String):FileNode {
    return fileNode.children.find(c=>c.name==attributeName);
  }

  /**
   * Delete all the attributes of the concerned FileNode
   * @param fileNode The concerned FileNode
   */
  deleteAllAttributes(fileNode: FileNode):void {
    fileNode.children = fileNode.children.filter(c=>c.type!==TypeConstants.attribute);
  }

    /** Update an item Tree node */
    updateItem(node: FileNode) {
      this.dataChange.next(node[0]);
      console.log("Node updated to : ", this.dataChange.getValue())

    }

    removeItem(nodesToBeDeleted: FileNode[], root: FileNode) {
      if (nodesToBeDeleted.length) {
        for (let node of nodesToBeDeleted) {
          let nodeToBeDeleted = this.getFileNodeByName(root,node.name);
          //Check if node exists in the file tree
          if (nodeToBeDeleted) {
            const parentNode = nodeToBeDeleted.parent;
            console.log("On removeItem with node : ", nodeToBeDeleted, "and parent : ", parentNode);
            const index = parentNode.children.indexOf(nodeToBeDeleted);
            if (index !== -1) {
              parentNode.children.splice(index, 1);
              this.parentNodeMap.delete(nodeToBeDeleted);
            }
            console.log("Deleted node : ", nodeToBeDeleted, "and his parent : ", parentNode);
          }
        }
      }
      console.log("No nodes will be deleted")
    }

     /** Find a parent tree node */
  findParent(id: number, node: FileNode): FileNode {
    console.log("On findParent with parent node id : ", id , " and node : ", node);
    if (node && node.id === id) {
      return node;
    } else {
      //console.log('ELSE ' + JSON.stringify(node.children));
      if (node.children && id) {
        for (let element = 0; node.children.length; element++) {
          //console.log('Recursive ' + JSON.stringify(node.children[element].children));
          //console.error("Node here : ", node.children[element], element)
          if (element && node.children && node.children.length > 0 && node.children[element].children.length > 0) {
            return this.findParent(id, node.children[element]);
          } else {
            continue;
          }
        }
      }
    }
  }

    sendNodeMetadata(node: FileNode) {
      let rulesFromService = this.tabChildrenRulesChange.getValue()
      let tabChildrenToInclude = rulesFromService[0];
      let tabChildrenToExclude = rulesFromService[1];
      console.log("Node clicked : ", node, "...with tab rules from service : ", rulesFromService);
      console.log("The found node on filetree : ", node.sedaData)
      this.sedaService.selectedSedaNode.next(node.sedaData);
      this.dataChange.next(node[0]);
      this.sendNode(node);
      let dataTable = this.fileMetadataService.fillDataTable(node.sedaData, node, tabChildrenToInclude, tabChildrenToExclude);
      console.log("Data revtried on click : ", dataTable);
      console.log("Node seda %s in filetree is ready to be edited with seda data %o", node.name, this.sedaService.selectedSedaNode.getValue());
      this.fileMetadataService.dataSource.next(dataTable);
    }

    getFileNodeByName(fileTree:FileNode, nodeNameToFind:string):FileNode {
      if (fileTree){
      if (fileTree.name === nodeNameToFind) {
        return fileTree;
      }
      for (const child of fileTree.children) {
        const res = this.getFileNodeByName(child, nodeNameToFind);
        if (res) {
          return res;
        }
      }
    }
    }

    getFileNodeById(fileTree:FileNode, nodeIdToFind:number): any {
      if (fileTree){
      if (fileTree.id === nodeIdToFind) {
        return fileTree;
      }
      for (const child of fileTree.children) {
        const res = this.getFileNodeById(child, nodeIdToFind);
        if (res) {
          return res;
        }
      }
    }
    }

    getFileNodeLocally(currentNode:FileNode, nameNode:string):FileNode {
      //console.log("Node on this.findSedaNode : %o", currentNode)
      if (currentNode){
      let i: number, currentChild: FileNode;
      if (nameNode == currentNode.name ) {
        return currentNode;
      } else {
        // Use a for loop instead of forEach to avoid nested functions
        // Otherwise "return" will not work properly
        if (currentNode.children) {
          for (i = 0; i < currentNode.children.length; i += 1) {
            currentChild = currentNode.children[i];
            // Search in the current child
            let result = this.getFileNodeLocally(currentChild,nameNode);
            // Return the result if the node has been found
            if (result) {
              return result;
            }
          }
        } else {
            // The node has not been found and we have no more options
            console.log("No SEDA nodes could be found for ", nameNode);
            return;
        }
      }
    }
  }

   getComplexSedaChildrenAsFileNode(sedaElement:SedaData):FileNode[] {
    // Insert all children of complex elements based on SEDA definition
    if (sedaElement.Element === SedaElementConstants.complex &&
      sedaElement.Children.length > 0) {
          let fileNodeComplexChildren : FileNode[] = [];
          sedaElement.Children.forEach((child: { Cardinality: string; Name: string; Type: string; }) => {
                if (child.Cardinality === SedaCardinalityConstants.one ||
                    child.Cardinality === SedaCardinalityConstants.oreOrMore) {
                      let aFileNode : FileNode = {} as FileNode;
                      aFileNode.name = child.Name;
                      aFileNode.cardinality = child.Cardinality;
                      aFileNode.children = [];
                      aFileNode.type = TypeConstants[child.Type as keyof typeof TypeConstants];
                      fileNodeComplexChildren.push(aFileNode);
                }
              })
              return fileNodeComplexChildren
            }

    }

    updateMedataTable(node:FileNode){
      //let isNodeComplex = this.sedaService.checkSedaElementType(node.name,this.sedaService.selectedSedaNodeParent.getValue())
      let rulesFromService = this.tabChildrenRulesChange.getValue()
      let tabChildrenToInclude = rulesFromService[0];
      let tabChildrenToExclude = rulesFromService[1];
      this.sedaService.selectedSedaNode.next(node.sedaData);
      let dataTable = this.fileMetadataService.fillDataTable(node.sedaData, node, tabChildrenToInclude, tabChildrenToExclude);
      let hasAtLeastOneComplexChild = node.children.some(el=> el.type  === TypeConstants.element);

      if(node.sedaData.Element === SedaElementConstants.complex){
        this.fileMetadataService.shouldLoadMetadataTable.next(hasAtLeastOneComplexChild);
        console.log("The the current tab root node is : ", node)
        this.sedaService.selectedSedaNode.next(node.sedaData);
        console.log("Filled data on table : ", dataTable, "...should load : ", this.fileMetadataService.shouldLoadMetadataTable.getValue());
        this.fileMetadataService.dataSource.next(dataTable);
      } else {
        this.fileMetadataService.shouldLoadMetadataTable.next(true);
        this.fileMetadataService.dataSource.next(dataTable);
      }
    }
  }
