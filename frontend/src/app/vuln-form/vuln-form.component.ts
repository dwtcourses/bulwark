import { Component, OnChanges, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AppService } from '../app.service';
import { Vulnerability } from './Vulnerability';
import { faTrash, faPlus, faEye, faEyeSlash } from '@fortawesome/free-solid-svg-icons';
import { AppFile } from '../classes/App_File';

@Component({
  selector: 'app-vuln-form',
  templateUrl: './vuln-form.component.html',
  styleUrls: ['./vuln-form.component.sass']
})
export class VulnFormComponent implements OnChanges, OnInit {
  vulnModel: Vulnerability;
  vulnForm: FormGroup;
  submitted = false;
  alertType: string;
  alertMessage: string;
  orgId: string;
  assetId: string;
  assessmentId: string;
  vulnId: number;
  vulnFormData: FormData;
  tempScreenshots: object[] = [];
  screenshotsToDelete: number[] = [];
  faTrash = faTrash;
  faPlus = faPlus;
  faEye = faEye;
  faEyeSlash = faEyeSlash;
  previewDescription = false;
  previewDetailedDesc = false;
  previewRemediation = false;
  impactAssess = 0;
  likelihoodAssess = 0;
  riskAssess = 0;

  constructor(
    private appService: AppService,
    public activatedRoute: ActivatedRoute,
    public router: Router,
    private fb: FormBuilder
  ) {
    this.createForm();
  }

  /**
   * Specific to the vulnerability form, init is called to retreive all data associated with the vuln-form component
   * Attach subscriptions to likelihood and impact for dynamic risk attribute in the form
   * @memberof VulnFormComponent
   */
  ngOnInit() {
    this.vulnForm.get('impact').valueChanges.subscribe(
      value => {
        if (this.impactAssess === 0) {
        if (value === 'High') {
          this.impactAssess += 3;
        } else if (value === 'Medium') {
          this.impactAssess += 2;
        } else {
          this.impactAssess += 1;
        }
        this.updateRisk();
      } else {
        this.impactAssess = 0;
        if (value === 'High') {
          this.impactAssess += 3;
        } else if (value === 'Medium') {
          this.impactAssess += 2;
        } else {
          this.impactAssess += 1;
        }
        this.updateRisk();
      }
    }
    );
    this.vulnForm.get('likelihood').valueChanges.subscribe(
      value => {
        if (this.likelihoodAssess === 0) {
        if (value === 'High') {
          this.likelihoodAssess += 3;
        } else if (value === 'Medium') {
          this.likelihoodAssess += 2;
        } else {
          this.likelihoodAssess += 1;
        }
        this.updateRisk();
      } else {
        this.likelihoodAssess = 0;
        if (value === 'High') {
          this.likelihoodAssess += 3;
        } else if (value === 'Medium') {
          this.likelihoodAssess += 2;
        } else {
          this.likelihoodAssess += 1;
        }
        this.updateRisk();
      }
    }
    );
    this.activatedRoute.data.subscribe(({ vulnerability }) => {
      if (vulnerability) {
        this.vulnModel = vulnerability;
        for (const probLoc of vulnerability.problemLocations) {
          this.probLocArr.push(
            this.fb.group({
              id: probLoc.id,
              location: probLoc.location,
              target: probLoc.target
            })
          );
        }
        for (const resource of vulnerability.resources) {
          this.resourceArr.push(
            this.fb.group({
              id: resource.id,
              description: resource.description,
              url: resource.url
            })
          );
        }
        for (const file of vulnerability['screenshots']) {
          const existFile: AppFile = file;
          this.appService.getImageById(existFile).then((url) => {
            existFile.imgUrl = url;
            this.previewScreenshot(null, existFile);
          });
        }
        this.vulnForm.patchValue(vulnerability);
      }
    });
    this.activatedRoute.params.subscribe((params) => {
      this.orgId = params['orgId'];
      this.assetId = params['assetId'];
      this.assessmentId = params['assessmentId'];
      this.vulnId = params['vulnId'];
    });
  }

  ngOnChanges() {
    this.rebuildForm();
  }

  /**
   * Function responsible for the generation of the Vulnerability form
   * this is a requirement for reactive forms in Angular
   * @memberof VulnFormComponent
   */
  createForm() {
    this.vulnForm = this.fb.group({
      impact: ['', [Validators.required]],
      likelihood: ['', [Validators.required]],
      risk: ['', [Validators.required]],
      systemic: ['', [Validators.required]],
      status: ['', Validators.required],
      description: ['', [Validators.required, Validators.maxLength(4000)]],
      remediation: ['', [Validators.required, Validators.maxLength(4000)]],
      name: ['', [Validators.required]],
      jiraId: ['', []],
      cvssScore: ['', Validators.required],
      cvssUrl: ['', Validators.required],
      detailedInfo: ['', [Validators.required, Validators.maxLength(4000)]],
      problemLocations: this.fb.array([]),
      resources: this.fb.array([])
    });
  }

  /**
   * Function is required to rebuild the form when requested it is required
   * for reactive forms in Angular
   * @memberof VulnFormComponent
   */
  rebuildForm() {
    this.vulnForm.reset({
      impact: this.vulnModel.impact,
      likelihood: this.vulnModel.likelihood,
      risk: this.vulnModel.risk,
      systemic: this.vulnModel.systemic,
      status: this.vulnModel.status,
      description: this.vulnModel.description,
      remediation: this.vulnModel.remediation,
      name: this.vulnModel.name,
      jiraId: this.vulnModel.jiraId,
      cvssScore: this.vulnModel.cvssScore,
      cvssUrl: this.vulnModel.cvssUrl,
      detailedInfo: this.vulnModel.detailedInfo,
      problemLocations: this.vulnModel.problemLocations,
      resources: this.vulnModel.resources
    });
  }

  /**
   * Gets array with all stored problem locations for retrevial by the UI
   * @readonly
   * @memberof VulnFormComponent
   * @return problem location array data to be passed into the form for submission
   */
  get probLocArr() {
    return this.vulnForm.get('problemLocations') as FormArray;
  }

  /**
   * Function responsible for initializing the form fields for location and target
   * needed for pulling data when a vulnerability is edited or a new vulnerability resource
   * is added by the user with the '+' icon, specific to Problem Location
   * @returns {FormGroup}
   * @memberof VulnFormComponent
   */
  initProbLocRows(): FormGroup {
    return this.fb.group({
      location: '',
      target: ''
    });
  }

  /**
   * Function responsible for adding content into the ProbLocArr[]
   * Populates within the reactive form for submission later in the process
   * @memberof VulnFormComponent
   */
  addProbLoc() {
    this.probLocArr.push(this.initProbLocRows());
  }

  /**
   * Function responsible for removing content from the ProbLocArr[]
   * Removes elements from the array by index value
   * @param {number} index is the ID of the index to be removed from the array
   * @memberof VulnFormComponent
   */
  deleteProbLoc(index: number) {
    this.probLocArr.removeAt(index);
  }

  /**
   * Get array with all stored resources required within the Vulnerability form
   * later used in the form submission call
   * @readonly
   * @memberof VulnFormComponent
   * @return retuns the array of resource locations added into the vulnerability form
   */
  get resourceArr() {
    return this.vulnForm.get('resources') as FormArray;
  }

  /**
   * Function responsible for initializing the form fields for description and url
   * needed for pulling data when a vulnerability is edited or a new vulnerability resource
   * is added by the user with the '+' icon, specific to Resources
   * @returns {FormGroup}
   * @memberof VulnFormComponent
   */
  initResourceRows(): FormGroup {
    return this.fb.group({
      description: '',
      url: ''
    });
  }

  /**
   * Function responsible for adding form data to the Resource Array
   * utilizing the data within the reactive form
   * @memberof VulnFormComponent
   */
  addResource() {
    this.resourceArr.push(this.initResourceRows());
  }

  /**
   * Function responsible for deletion of a resource from the form
   * @param {number} index is the associated value of the array index value to be removed
   * @memberof VulnFormComponent
   */
  deleteResource(index: number) {
    this.resourceArr.removeAt(index);
  }

  /**
   * Function is responsible for processing a file array to be used in the form
   * iterates over all attached files to be processed
   * @param {FileList} files
   * @memberof VulnFormComponent
   */
  handleFileInput(files: FileList) {
    for (let i = 0; i < files.length; i++) {
      const file = files.item(i);
      this.previewScreenshot(file, null);
    }
  }

  /**
   * Function responsible for retreiving an image and processing it back to the UI
   * renders it back to the browser using the createObjectUrl feature
   * @param {File} file
   * @param {AppFile} existFile
   * @memberof VulnFormComponent
   */
  previewScreenshot(file: File, existFile: AppFile) {
    // Image from DB
    if (existFile) {
      const renderObj = {
        url: existFile.imgUrl,
        file: existFile
      };
      this.tempScreenshots.push(renderObj);
    } else {
      const url = this.appService.createObjectUrl(file);
      // File objects do not have an `originalname` property so we need to add it
      file['originalname'] = file.name;
      const renderObj = {
        url,
        file
      };
      this.tempScreenshots.push(renderObj);
    }
  }

  /**
   * Function responsible for removal of screenshots from the Vulnerability Form
   * @param {File} file the associated index of the file to be removed
   * @memberof VulnFormComponent
   */
  deleteScreenshot(file: File) {
    const index = this.tempScreenshots.indexOf(file);
    if (index > -1) {
      this.screenshotsToDelete.push(file['file']['id']);
      this.tempScreenshots.splice(index, 1);
    }
  }

  /**
   * Function responsible for populating the screenshot array and removal
   * of screenshots performed during data entry
   * @param {object[]} screenshots object data for screenshots to be processed
   * @param {number[]} screenshotsToDelete object data for screenshots to be removed
   * @memberof VulnFormComponent
   */
  finalizeScreenshots(screenshots: object[], screenshotsToDelete: number[]) {
    this.vulnFormData.delete('screenshots');
    if (screenshots.length) {
      for (const screenshot of screenshots) {
        this.vulnFormData.append('screenshots', screenshot['file']);
      }
    }
    if (screenshotsToDelete.length) {
      this.vulnFormData.append('screenshotsToDelete', JSON.stringify(screenshotsToDelete));
    }
  }

  /**
   * Function to navigate to Vulnerabilities, takes no input from the user
   * @memberof VulnFormComponent
   */
  navigateToVulnerabilities() {
    this.router.navigate([
      `organization/${this.orgId}/asset/${this.assetId}/assessment/${this.assessmentId}/vulnerability`
    ]);
  }

  /**
   * Function responsible for handling the form submission objects and data
   * @param {FormGroup} vulnForm form object holding data to be processed
   * @memberof VulnFormComponent
   */
  onSubmit(vulnForm: FormGroup) {
    this.vulnFormData = new FormData();
    const newScreenshots = this.tempScreenshots.filter((screenshot) => !screenshot['file'].id);
    this.finalizeScreenshots(newScreenshots, this.screenshotsToDelete);
    this.vulnModel = vulnForm.value;
    this.vulnFormData.append('impact', this.vulnModel.impact);
    this.vulnFormData.append('likelihood', this.vulnModel.likelihood);
    this.vulnFormData.append('risk', this.vulnModel.risk);
    this.vulnFormData.append('systemic', this.vulnModel.systemic);
    this.vulnFormData.append('status', this.vulnModel.status);
    this.vulnFormData.append('description', this.vulnModel.description);
    this.vulnFormData.append('remediation', this.vulnModel.remediation);
    this.vulnFormData.append('jiraId', this.vulnModel.jiraId);
    this.vulnFormData.append('cvssScore', this.vulnModel.cvssScore.toString());
    this.vulnFormData.append('cvssUrl', this.vulnModel.cvssUrl);
    this.vulnFormData.append('detailedInfo', this.vulnModel.detailedInfo);
    this.vulnFormData.append('assessment', this.assessmentId);
    this.vulnFormData.append('name', this.vulnModel.name);
    this.vulnFormData.append('problemLocations', JSON.stringify(this.vulnModel.problemLocations));
    this.vulnFormData.append('resources', JSON.stringify(this.vulnModel.resources));
    this.createOrUpdateVuln(this.vulnFormData);
  }

  /**
   * Function responsible for handling the vulnerability form data
   * processes the data for either creation or updating a vulnerability
   * @param {FormData} vuln form object holding all data to be processed
   * @memberof VulnFormComponent
   */
  createOrUpdateVuln(vuln: FormData) {
    if (this.vulnId) {
      this.appService.updateVulnerability(this.vulnId, vuln).subscribe((success) => {
        this.navigateToVulnerabilities();
      });
    } else {
      this.appService.createVuln(vuln).subscribe(
        (success) => {
          this.navigateToVulnerabilities();
        },
        (error) => {
          // Reset current form data to avoid duplicate inputs
          this.vulnFormData = new FormData();
        }
      );
    }
  }

  /**
   * Function responsible for either showing a preview or hiding a preview
   * within the form for showing the data in markup or as regular text for
   * Description
   * @memberof VulnFormComponent
   */
  toggleDescPreview() {
    this.previewDescription = !this.previewDescription;
  }

  /**
   * Function responsible for either showing a preview or hiding a preview
   * within the form showing the data in markup or as regular text for
   * Detailed Information
   * @memberof VulnFormComponent
   */
  toggleDetailedDescPreview() {
    this.previewDetailedDesc = !this.previewDetailedDesc;
  }

  /**
   * Function responsible for either showing a preview or hiding a preview
   * within the form showing the data in markup or as regular text for
   * Remediation
   * @memberof VulnFormComponent
   */
  toggleRemediationPreview() {
    this.previewRemediation = !this.previewRemediation;
  }

  /**
   * Function responsible for updating the risk value on the vulnerability form
   * based on impact and likelihood value held within the vuln-form object
   * @memberof VulnFormComponent
   */
  updateRisk() {
    const value: number = this.impactAssess + this.likelihoodAssess;
    this.riskAssess = value;

    if (value === 6) {
      this.vulnForm.patchValue({
        risk: 'Critical',
      });
    } else if (value === 5) {
      this.vulnForm.patchValue({
        risk: 'High',
      });
  } else if (value === 4) {
      this.vulnForm.patchValue({
        risk: 'Medium',
      });
  } else if (value === 3) {
      this.vulnForm.patchValue({
        risk: 'Low',
      });
  } else {
      this.vulnForm.patchValue({
        risk: 'Informational',
      });
  }
}

}
