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
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CardinalityValues, MetadataHeaders } from 'projects/pastis/src/app/core/classes/models';
import { CardinalityConstants, FileNode, TypeConstants } from '../classes/file-node';
import { SedaData, SedaElementConstants } from '../classes/seda-data';

@Injectable({
  providedIn: 'root'
})
export class FileTreeMetadataService {

  cardinalityValues: CardinalityValues[] = [];
  allowedCardinality: Map<string, string[]>;
  dataSource = new BehaviorSubject<MetadataHeaders[]>(null);
  selectedCardinalities = new BehaviorSubject<string[]>([]);
  allowedSedaCardinalities = new BehaviorSubject<string[][]>([]);

  shouldLoadMetadataTable = new BehaviorSubject<boolean>(true);


  constructor() {
    this.initCardinalityValues();
  }

  initCardinalityValues() {
    for (let key in CardinalityConstants) {
      let cardinality: CardinalityValues = { value: CardinalityConstants[key as keyof typeof CardinalityConstants], viewValue: key };
      this.cardinalityValues.push(cardinality);
    }
    this.allowedCardinality = new Map<string, string[]>();
    this.allowedCardinality.set('1', ['1']);
    this.allowedCardinality.set('', ['1']);
    this.allowedCardinality.set(null, ['1']);
    this.allowedCardinality.set(undefined, ['1']);
    this.allowedCardinality.set("null", ['1']);
    this.allowedCardinality.set('0-1', ['0-1', '1']);
    this.allowedCardinality.set('0-N', ['0-1', '0-N', '1-N', '1']);
    this.allowedCardinality.set('1-N', ['1', '1-N']);
  }

  fillDataTable(sedaChild: SedaData, clickedNode: FileNode, _childrenToInclude:string[], childrenToExclude:string[]): MetadataHeaders[] {
    let data:MetadataHeaders[] = [];
    let allowedCardList: string[][];
    if (clickedNode.children.length > 0 ) {
      for (let child of clickedNode.children) {
       // There are cases where there are no childrenToExclude declared
       // So we must check if it exists to avoid and undefined of includes error
       if (childrenToExclude && !childrenToExclude.includes(child.name) && 
          child.type !== TypeConstants.attribute) {

        data.push({
          id: child.id,
          nomDuChamp: child.name,
          valeurFixe: child.value,
          cardinalite: this.findSedaAllowedCardinalityList(sedaChild, child),
          commentaire: child.documentation,
          type: child.dataType,
          enumeration: child.sedaData.Enumeration,
        })
       } else if (!childrenToExclude && child.type !== TypeConstants.attribute){
          data.push({
            id: child.id,
            nomDuChamp: child.name,
            valeurFixe: child.value,
            cardinalite: this.findSedaAllowedCardinalityList(sedaChild, child),
            commentaire: child.documentation,
            type: child.dataType,
            enumeration: child.sedaData.Enumeration})
        }
        // It should be a simple element with children attributes.
        // In that case, the data table will be filled with data from the clicked node
        // (and only once)
        else if (clickedNode.type  === TypeConstants.element && sedaChild.Element === SedaElementConstants.simple){
          data.push({
            id: clickedNode.id,
            nomDuChamp: clickedNode.name,
            valeurFixe: clickedNode.value,
            cardinalite: this.findSedaAllowedCardinalityList(sedaChild, clickedNode),
            commentaire: clickedNode.documentation,
            type: clickedNode.dataType,
            enumeration: clickedNode.sedaData.Enumeration,
          })
          break;
        }
      }
    } // No children : it should be a SEDA simple element type without children 
     //  It this case, the retrieved data is the current clicked node data
      else {
        data.push({
          id: clickedNode.id,
          nomDuChamp: clickedNode.name,
          valeurFixe: clickedNode.value,
          cardinalite: this.findSedaAllowedCardinalityList(sedaChild, clickedNode),
          commentaire: clickedNode.documentation,
          type: clickedNode.dataType,
          enumeration: clickedNode.sedaData.Enumeration,
        })
      }
    this.allowedSedaCardinalities.next(allowedCardList);
    this.selectedCardinalities.next(this.findCardinalities(clickedNode, sedaChild, data));
    console.log("Data on fillDataTable", data, "with selected cards :", this.selectedCardinalities.getValue());
    return data;
  }

  findSedaAllowedCardinalityList(sedaNode: SedaData, fileNode: FileNode): string[] {
    let allowedCardinalityListResult: string[] = [];
    let resultList: string[][] = [];

    // If the clicked node has the same name was the seda node, the node is already found
    if (sedaNode.Name === fileNode.name) {
      allowedCardinalityListResult = this.allowedCardinality.get(sedaNode.Cardinality);
      return allowedCardinalityListResult;
    }
    if (sedaNode.Children.length > 0) {
      // Search the sedaNode children to find the correnpondent cardinality list
      for (let child of sedaNode.Children) {
        if ((child.Name === fileNode.name) || (sedaNode.Name === fileNode.name)) {
          // Used in the case we wish to "correct" the node's cardinality, since
          // the seda cardinality wont include the cardinality retrieved by node's rng file.
          // In this case, the condition will return the rng file cardinality list
          // instead of node's cardinality list in accordance with the SEDA specification.
          //if (child.Cardinality !== sedaNode.Cardinality){
          //allowedCardinalityListResult = this.allowedCardinality.get(clickedNode.cardinality);
          //return allowedCardinalityListResult;
          //}
          allowedCardinalityListResult = this.allowedCardinality.get(child.Cardinality);
          resultList.push(allowedCardinalityListResult)
          this.allowedSedaCardinalities.next(resultList)

          return allowedCardinalityListResult;
        } 
      }
    } else {
      //console.error("Final CARDINALITY LIST (NO seda children found) : ", allowedCardinalityListResult, " for ", sedaNode.Name);
      for (const [card, cardlist] of this.allowedCardinality) {
        if (card === fileNode.cardinality) {
          !fileNode.cardinality ? allowedCardinalityListResult.push("1") : allowedCardinalityListResult = cardlist;
          //result = cardlist;
          resultList.push(cardlist)
          this.allowedSedaCardinalities.next(resultList)
          //console.error("Final CARDINALITY LIST : ", allowedCardinalityListResult)
          return allowedCardinalityListResult;
        }
      }
    }
    this.allowedSedaCardinalities.next(resultList)

    if (allowedCardinalityListResult.length < 1) {
      //console.error("Card not found for : ", clickedNode.name, "..assuming attribute cardinality :", clickedNode.cardinality);
      allowedCardinalityListResult = this.allowedCardinality.get(fileNode.cardinality);
      //!clickedNode.cardinality ? result.push("1") : result = this.allowedCardinality[clickedNode.cardinality];
      return allowedCardinalityListResult;

    }
  }

  findCardinalities(clickedNode: FileNode, sedaNode: SedaData, data:MetadataHeaders[]):string[] {
    let childrenCardMap = new Map();
    let idsToKeep = data.map(name=>name.id);
    let nodesToKeep = clickedNode.children.filter(child=>idsToKeep.includes(child.id))

    if (sedaNode.Children.length > 0) {
        for (let fileNodechild of nodesToKeep) {
          sedaNode.Children.forEach((sedaGrandChild: { Name: string; })=>{
            if (fileNodechild.name === sedaGrandChild.Name) {
              fileNodechild.cardinality ? childrenCardMap.set(fileNodechild.id,fileNodechild.cardinality) : childrenCardMap.set(fileNodechild.id,"1");
            }
          })
      }
    } else {
      !clickedNode.cardinality ? childrenCardMap.set(clickedNode.id,"1") : childrenCardMap.set(clickedNode.id,clickedNode.cardinality);
    }
    if (childrenCardMap.size < 1) {
      !clickedNode.cardinality ? childrenCardMap.set(clickedNode.id,"1") : childrenCardMap.set(clickedNode.id,clickedNode.cardinality);
    }
    return Array.from(childrenCardMap.values());
  }

  /**
   * Find the children of sedaParent and return the 'Enumeration' property
   * @param sedaParent the seda parent of the node we want to find
   * @param childName the name of the seda node we want to find
   */
  getEnumerationFromSedaNodeChildren(sedaParent: SedaData, childName: string): string[] {
    if (sedaParent.Name === childName){
      return sedaParent.Enumeration;
    }
    let sedaNode: SedaData = sedaParent.Children.find((c: { Name: string; }) => c.Name === childName);
    if (sedaNode){
      return sedaNode.Enumeration
    }
    return [];
  }
  shouldLoadTable(){
    return this.shouldLoadMetadataTable.getValue();
  }
  enableAttributeOption(nodeType:string){
    return nodeType === TypeConstants.attribute;
  }
}
