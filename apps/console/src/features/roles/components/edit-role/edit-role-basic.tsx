/**
 * Copyright (c) 2020, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License
 */

import {
    AlertInterface,
    AlertLevels,
    RolesInterface,
    TestableComponentInterface
} from "@wso2is/core/models";
import { addAlert } from "@wso2is/core/store";
import { Forms } from "@wso2is/forms"
import { ConfirmationModal, DangerZone, DangerZoneGroup, EmphasizedSegment } from "@wso2is/react-components";
import React, { ChangeEvent, FunctionComponent, ReactElement, useEffect, useState } from "react"
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { Button, Divider, Form, Grid, Input, InputOnChangeData, Label } from "semantic-ui-react"
import { AppConstants, history } from "../../../core";
import { PRIMARY_USERSTORE_PROPERTY_VALUES, validateInputAgainstRegEx } from "../../../userstores";
import { deleteRoleById, updateRoleDetails } from "../../api";
import { PatchRoleDataInterface } from "../../models";

/**
 * Interface to contain props needed for component
 */
interface BasicRoleProps extends TestableComponentInterface {
    /**
     * Role details
     */
    roleObject: RolesInterface;
    /**
     * Show if it is role.
     */
    isGroup: boolean;
    /**
     * Handle role update callback.
     */
    onRoleUpdate: () => void;
    /**
     * Show if the user is read only.
     */
    isReadOnly?: boolean;
}

/**
 * Component to edit basic role details.
 * 
 * @param props Role object containing details which needs to be edited.
 */
export const BasicRoleDetails: FunctionComponent<BasicRoleProps> = (props: BasicRoleProps): ReactElement => {
    const { t } = useTranslation();
    const dispatch = useDispatch();

    const {
        roleObject,
        onRoleUpdate,
        isGroup,
        isReadOnly,
        [ "data-testid" ]: testId
    } = props;

    const [ showRoleDeleteConfirmation, setShowDeleteConfirmationModal ] = useState<boolean>(false);
    const [ labelText, setLableText ] = useState<string>("");
    const [ nameValue, setNameValue ] = useState<string>("");
    const [ userStoreRegEx, setUserStoreRegEx ] = useState<string>("");
    const [ isRoleNamePatternValid, setIsRoleNamePatternValid ] = useState<boolean>(true);
    const [ isRegExLoading, setRegExLoading ] = useState<boolean>(false);

    useEffect(() => {
        if (roleObject && roleObject.displayName.indexOf("/") !== -1) {
            setNameValue(roleObject.displayName.split("/")[1]);
            setLableText(roleObject.displayName.split("/")[0]);
        } else if (roleObject) {
            setNameValue(roleObject.displayName);
        }
    }, [ roleObject ]);

    useEffect(() => {
        if (userStoreRegEx !== "") {
            return;
        }
        fetchUserstoreRegEx()
            .then((response) => {
                setUserStoreRegEx(response);
                setRegExLoading(false);
            });
    }, [ nameValue ]);

    const fetchUserstoreRegEx = async (): Promise<string> => {
        // TODO: Enable when the role object includes user store.
        // if (roleObject && roleObject.displayName.indexOf("/") !== -1) {
        //     // Get the role name regEx for the secondary user store
        //     const userstore = roleObject.displayName.split("/")[0].toString().toLowerCase();
        //     await getUserstoreRegEx(userstore, USERSTORE_REGEX_PROPERTIES.RolenameRegEx)
        //         .then((response) => {
        //             setRegExLoading(true);
        //             regEx = response;
        //         })
        // } else if (roleObject) {
        //     // Get the role name regEx for the primary user store
        //     regEx = PRIMARY_USERSTORE_PROPERTY_VALUES.RolenameJavaScriptRegEx;
        // }
        return PRIMARY_USERSTORE_PROPERTY_VALUES.RolenameJavaScriptRegEx;
    };

    /**
     * The following function handles the role name change.
     *
     * @param event
     * @param data
     */
    const handleRoleNameChange = (event: ChangeEvent, data: InputOnChangeData): void => {
        setNameValue(data.value);
        setIsRoleNamePatternValid(validateInputAgainstRegEx(data.value, userStoreRegEx));
    };

    /**
     * Dispatches the alert object to the redux store.
     *
     * @param {AlertInterface} alert - Alert object.
     */
    const handleAlerts = (alert: AlertInterface): void => {
        dispatch(addAlert(alert));
    };

    /**
     * Function which will handle role deletion action.
     * 
     * @param id - Role ID which needs to be deleted
     */
    const handleOnDelete = (id: string): void => {
        deleteRoleById(id).then(() => {
            handleAlerts({
                description: isGroup
                    ? t("adminPortal:components.groups.notifications.deleteGroup.success.description")
                    : t("adminPortal:components.roles.notifications.deleteRole.success.description"),
                level: AlertLevels.SUCCESS,
                message: isGroup
                    ? t("adminPortal:components.groups.notifications.deleteGroup.success.message")
                    : t("adminPortal:components.roles.notifications.deleteRole.success.message")
            });
            if (isGroup) {
                history.push(AppConstants.PATHS.get("GROUPS"));
            } else {
                history.push(AppConstants.PATHS.get("ROLES"));
            }
        });
    };

    /**
     * Method to update role name for the selected role.
     * 
     * @param values Form values which will be used to update the role
     */
    const updateRoleName = (values: any): void => {
        const roleData: PatchRoleDataInterface = {
            schemas: [
                "urn:ietf:params:scim:api:messages:2.0:PatchOp"
            ],
            Operations: [{
                "op": "replace",
                "value": {
                    "displayName": labelText ? labelText + "/" + nameValue : nameValue
                }
            }]
        };

        updateRoleDetails(roleObject.id, roleData)
            .then(() => {
                onRoleUpdate();
                handleAlerts({
                    description: isGroup
                        ? t("adminPortal:components.groups.notifications.updateGroup.success.description")
                        : t("adminPortal:components.roles.notifications.updateRole.success.description"),
                    level: AlertLevels.SUCCESS,
                    message: isGroup
                        ? t("adminPortal:components.groups.notifications.updateGroup.success.message")
                        : t("adminPortal:components.roles.notifications.updateRole.success.message")
                });
            }).catch(() => {
                handleAlerts({
                    description: isGroup
                        ? t("adminPortal:components.groups.notifications.updateGroup.error.description")
                        : t("adminPortal:components.roles.notifications.updateRole.error.description"),
                    level: AlertLevels.ERROR,
                    message: isGroup
                        ? t("adminPortal:components.groups.notifications.updateGroup.error.message")
                        : t("adminPortal:components.roles.notifications.updateRole.error.message")
                });
            });
    };

    return (
        <>
            <EmphasizedSegment>
                <Forms
                    onSubmit={ (values) => {
                        updateRoleName(values)
                    } }
                >
                    <Grid>
                        <Grid.Row columns={ 1 }>
                            <Grid.Column mobile={ 12 } tablet={ 12 } computer={ 6 }>
                                <Form.Field
                                    error={ !isRoleNamePatternValid }
                                >
                                    <label
                                        data-testid={
                                            isGroup
                                                ? `${ testId }-group-name-label`
                                                : `${ testId }-role-name-label`
                                        }
                                    >
                                        {
                                            isGroup
                                                ? t("adminPortal:components.groups.edit.basics.fields.groupName.name")
                                                : t("adminPortal:components.roles.edit.basics.fields.roleName.name")
                                        }
                                    </label>
                                    <Input
                                        required={ true }
                                        name={ "rolename" }
                                        label={ labelText !== "" ? labelText + " /" : null }
                                        requiredErrorMessage={
                                            isGroup
                                                ? t("adminPortal:components.groups.edit.basics.fields.groupName" +
                                                ".required")
                                                : t("adminPortal:components.roles.edit.basics.fields.roleName" +
                                                ".required")
                                        }
                                        placeholder={
                                            isGroup
                                                ? t("adminPortal:components.groups.edit.basics.fields.groupName." +
                                                "placeholder")
                                                : t("adminPortal:components.roles.edit.basics.fields.roleName." +
                                                "placeholder")
                                        }
                                        value={ nameValue }
                                        onChange={ handleRoleNameChange }
                                        type="text"
                                        data-testid={
                                            isGroup
                                                ? `${ testId }-group-name-input`
                                                : `${ testId }-role-name-input`
                                        }
                                        loading={ isRegExLoading }
                                        readOnly={ isReadOnly }
                                    />
                                    {
                                        !isRoleNamePatternValid && (
                                            isGroup
                                                ?
                                                <Label basic color="red" pointing>
                                                    { t("adminPortal:components.roles.addRoleWizard.forms." +
                                                        "roleBasicDetails.roleName.validations.invalid",
                                                        { type: "group" }) }
                                                </Label>
                                                :
                                                <Label basic color="red" pointing>
                                                    { t("adminPortal:components.roles.addRoleWizard.forms." +
                                                        "roleBasicDetails.roleName.validations.invalid",
                                                        { type: "role" }) }
                                                </Label>
                                        )
                                    }
                                </Form.Field>
                            </Grid.Column>
                        </Grid.Row>
                        <Grid.Row columns={ 1 }>
                            <Grid.Column mobile={ 16 } tablet={ 16 } computer={ 8 }>
                                {
                                    !isReadOnly && (
                                        <Button
                                            primary
                                            type="submit"
                                            size="small"
                                            className="form-button"
                                            data-testid={
                                                isGroup
                                                    ? `${ testId }-group-update-button`
                                                    : `${ testId }-role-update-button`
                                            }
                                            disabled={ !isRoleNamePatternValid && !isRegExLoading }
                                        >
                                            { t("adminPortal:components.roles.edit.basics.buttons.update") }
                                        </Button>
                                    )
                                }
                            </Grid.Column>
                        </Grid.Row>
                    </Grid>
                </Forms>
            </EmphasizedSegment>
            <Divider hidden />
            {
                !isReadOnly && (
                    <DangerZoneGroup sectionHeader="Danger Zone">
                        <DangerZone
                            actionTitle={
                                isGroup
                                    ? t("adminPortal:components.roles.edit.basics.dangerZone.actionTitle",
                                    { type: "Group" })
                                    : t("adminPortal:components.roles.edit.basics.dangerZone.actionTitle",
                                    { type: "Role" })
                            }
                            header={
                                isGroup
                                    ? t("adminPortal:components.roles.edit.basics.dangerZone.header",
                                    { type: "group" })
                                    : t("adminPortal:components.roles.edit.basics.dangerZone.header",
                                    { type: "role" })
                            }
                            subheader={
                                isGroup
                                    ? t("adminPortal:components.roles.edit.basics.dangerZone.subheader",
                                    { type: "group" })
                                    : t("adminPortal:components.roles.edit.basics.dangerZone.subheader",
                                    { type: "role" })
                            }
                            onActionClick={ () => setShowDeleteConfirmationModal(!showRoleDeleteConfirmation) }
                            data-testid={
                                isGroup
                                    ? `${ testId }-group-danger-zone`
                                    : `${ testId }-role-danger-zone`
                            }
                        />
                    </DangerZoneGroup>
                )
            }
            {
                showRoleDeleteConfirmation && 
                    <ConfirmationModal
                        onClose={ (): void => setShowDeleteConfirmationModal(false) }
                        type="warning"
                        open={ showRoleDeleteConfirmation }
                        assertion={ roleObject.displayName }
                        assertionHint={
                            (
                                <p>
                                    <Trans
                                        i18nKey={
                                            "adminPortal:components.roles.edit.basics.confirmation.assertionHint"
                                        }
                                        tOptions={ { roleName: roleObject.displayName } }
                                    >
                                        Please type <strong>{ roleObject.displayName }</strong> to confirm.
                                    </Trans>
                                </p>
                            )
                        }
                        assertionType="input"
                        primaryAction="Confirm"
                        secondaryAction="Cancel"
                        onSecondaryActionClick={ (): void => setShowDeleteConfirmationModal(false) }
                        onPrimaryActionClick={ (): void => handleOnDelete(roleObject.id) }
                        data-testid={
                            isGroup
                                ? `${ testId }-group-confirmation-modal`
                                : `${ testId }-role-confirmation-modal`
                        }
                    >
                        <ConfirmationModal.Header>
                            { t("adminPortal:components.roles.edit.basics.confirmation.header") }
                        </ConfirmationModal.Header>
                        <ConfirmationModal.Message attached warning>
                            { t("adminPortal:components.roles.edit.basics.confirmation.message",
                                { type: isGroup ? "group." : "role." }) }
                        </ConfirmationModal.Message>
                        <ConfirmationModal.Content>
                            { t("adminPortal:components.roles.edit.basics.confirmation.content",
                                { type: isGroup ? "group." : "role." }) }
                        </ConfirmationModal.Content>
                    </ConfirmationModal>
            }
        </>
    )
};
