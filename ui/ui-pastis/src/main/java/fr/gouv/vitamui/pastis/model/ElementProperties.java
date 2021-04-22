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

package fr.gouv.vitamui.pastis.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import fr.gouv.vitamui.pastis.util.RNGConstants;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

public class ElementProperties implements Serializable {

    private static final long serialVersionUID = -5093112183496503253L;


    public ElementProperties() {
        super();
    }

    String name;
    String type;
    String cardinality;
    String groupOrChoice;
    String valueOrData;
    String dataType;
    String value;
    String documentation;

    @JsonIgnore
    Object sedaData;

    int level;
    Long id;
    Long parentId;

    @JsonIgnore
    ElementProperties parent;

    List<ElementProperties> choices = new ArrayList<ElementProperties>();

    List<ElementProperties> children = new ArrayList<ElementProperties>();

    PuaData puaData;

    public List<ElementProperties> getChildren() {
        return this.children;
    }

    public void setChildren(List<ElementProperties> children) {
        this.children = children;
    }

    public List<ElementProperties> getChoices() {
        return choices;
    }

    public void setChoices(List<ElementProperties> choices) {
        this.choices = choices;
    }

    public String getName() {
        return this.name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getType() {
        return this.type;
    }

    public void setType(String type) {
        this.type = type;
    }

    public String getValueOrData() {
        return this.valueOrData;
    }

    public void setValueOrData(String dataType) {
        this.valueOrData = dataType;
    }

    public String getCardinality() {
        return this.cardinality;
    }

    public void setCardinality(String cardinality) {
        if(null != RNGConstants.CardinalityMap.get(cardinality)) {
            this.cardinality = RNGConstants.CardinalityMap.get(cardinality);
        }else {
            this.cardinality = cardinality;
        }
    }

    public String getGroupOrChoice() {
        return groupOrChoice;
    }

    public void setGroupOrChoice(String groupOrChoice) {
        if(null != RNGConstants.GroupOrChoiceMap.get(groupOrChoice)) {
            this.groupOrChoice = RNGConstants.GroupOrChoiceMap.get(groupOrChoice);
        }else {
            this.groupOrChoice = groupOrChoice;
        }
    }

    public String getValue() {
        return this.value;
    }

    public void setValue(String value) {
        this.value = value;
    }

    public int getLevel() {
        return this.level;
    }

    public void setLevel(int level) {
        this.level = level;
    }

    public String getDataType() {
        return this.dataType;
    }

    public void setDataType(String dataType) {
        this.dataType = dataType;
    }


    public String getDocumentation() {
        return this.documentation;
    }

    public void setDocumentation(String documentation) {
        this.documentation = documentation;
    }

    public Long getId() {
        return this.id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getParentId() {
        return this.parentId;
    }

    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }

    @JsonIgnore
    public Object getSedaData() {
        return sedaData;
    }

    @JsonIgnore
    public void setSedaData(Object sedaData) {
        this.sedaData = sedaData;
    }

    @JsonIgnore
    public ElementProperties getParent() {
        return parent;
    }

    @JsonIgnore
    public void setParent(ElementProperties parent) {
        this.parent = parent;
    }

    public PuaData getPuaData() {
        return puaData;
    }

    public void setPuaData(PuaData puaData) {
        this.puaData = puaData;
    }



    public void init() {
        this.setName("");
        this.setCardinality("");
        this.setValueOrData("");
        this.setGroupOrChoice("");
        this.setValue("");
        this.setType("");
        this.setDataType("");

    }
    public void initTree(ElementProperties json) {
        for(ElementProperties child : json.getChildren()) {
            child.setParent(json);
            initTree(child);
        }
    }

    public Stream<ElementProperties> flattened() {
        return Stream.concat(
                Stream.of(this),
                children.stream().flatMap(ElementProperties::flattened));
    }
}
