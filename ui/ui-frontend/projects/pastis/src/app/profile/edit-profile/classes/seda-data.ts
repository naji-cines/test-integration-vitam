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
//Seda element constants :
//Seda elelemtns can be attributes, simple or complex elements

export enum SedaElementConstants {
    attribute = 'Attribute',
    simple = 'Simple',
    complex = 'Complex'
}

//Seda choice constants : can be yes or no 
export enum SedaChoiceConstants {
    yes = 'yes',
    no = 'no',
}

//Seda Extensible constants : can be yes or no 
export enum SedaExtensibleConstants {
    yes = 'yes',
    no = 'no',
}


export enum SedaCardinalityConstants {
    'zeroOrOne' = '0-1',
    'one' = '1',
    'oreOrMore' = '1-N',
    'zeroOrMore'  = '0-N'
}


export enum SedaCollections {
    'object' = 'Objets',
    'header' = 'Entete',
    'rules' = 'Regles',
    'arborescent'  = 'Aborescence'
}

export interface SedaData {
    [key: string]: any;
    Name:string;
    Type:string;
    Element:string;
    Cardinality:string;
    Definition:string;
    Extensible:boolean;
    Choice:boolean;
    Children: SedaData[];
    Enumeration:string[];
    Collection: SedaCollections;
}
