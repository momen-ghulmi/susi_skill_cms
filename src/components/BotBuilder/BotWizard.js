import React from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import StaticAppBar from '../StaticAppBar/StaticAppBar.react';
import { Step, Stepper, StepButton } from 'material-ui/Stepper';
import { Grid, Col, Row } from 'react-flexbox-grid';
import Build from './BotBuilderPages/Build';
import PropTypes from 'prop-types';
import Design from './BotBuilderPages/Design';
import Preview from './Preview/Preview';
import CircularProgress from 'material-ui/CircularProgress';
import { Link } from 'react-router-dom';
import Configure from './BotBuilderPages/Configure';
import notification from 'antd/lib/notification';
import Deploy from './BotBuilderPages/Deploy';
import Snackbar from 'material-ui/Snackbar';
import { Paper, TextField } from 'material-ui';
import ChevronLeft from 'material-ui/svg-icons/navigation/chevron-left';
import ChevronRight from 'material-ui/svg-icons/navigation/chevron-right';
import { urls, colors, avatars } from '../../utils';
import Icon from 'antd/lib/icon';
import * as $ from 'jquery';
import Cookies from 'universal-cookie';

const cookies = new Cookies();

class BotWizard extends React.Component {
  componentDidMount() {
    if (
      this.getQueryStringValue('template') ||
      this.getQueryStringValue('draftID') ||
      (this.getQueryStringValue('name') &&
        this.getQueryStringValue('group') &&
        this.getQueryStringValue('language'))
    ) {
      if (this.getQueryStringValue('template')) {
        for (let template of this.props.templates) {
          if (template.id === this.getQueryStringValue('template')) {
            let code = template.code;
            this.setState({
              buildCode: code,
              loaded: true,
            });
          }
        }
      } else if (this.getQueryStringValue('draftID')) {
        let draftID = this.getQueryStringValue('draftID');
        this.getDraftBotDetails(draftID);
      } else {
        // editing a saved bot
        let name = this.getQueryStringValue('name');
        let group = this.getQueryStringValue('group');
        let language = this.getQueryStringValue('language');
        this.setState({
          commitMessage: `Updated Bot ${name}`,
          newBot: false,
          skillName: name,
          skillGroup: group,
          skillLanguage: language,
        });
        this.getBotDetails(name, group, language);
      }
    } else {
      this.setState({
        loaded: true,
      });
    }
  }

  constructor(props) {
    super(props);
    let avatarsIcons = avatars.slice();
    this.state = {
      finished: false,
      stepIndex: 0,
      themeSettingsString: '{}',
      openSnackbar: false,
      msgSnackbar: '',
      slideState: 1, // 1 means in middle, 2 means preview collapsed
      colBuild: 8,
      colPreview: 4,
      prevButton: 0, // 0 means disappear, 1 means appear
      savingSkill: false,
      savedSkillOld: {}, // contains skill meta data information for last saved skill
      updateSkillNow: false,
      imageChanged: false,
      loaded: false,
      commitMessage: '',
      groupValue: null,
      languageValue: '',
      expertValue: '',
      file: null,
      imageUrl: 'susi_image.jpg',
      image: avatarsIcons[1].url,
      designData: null,
      preferUiView: 'code',
      newBot: true,
      skillName: '',
      skillGroup: '',
      skillLanguage: '',
      buildCode:
        '::name <Bot_name>\n::category <Category>\n::language <Language>\n::author <author_name>\n::author_url <author_url>\n::description <description> \n::dynamic_content <Yes/No>\n::developer_privacy_policy <link>\n::image images/susi_image.jpg\n::terms_of_use <link>\n\n\nUser query1|query2|quer3....\n!example:<The question that should be shown in public skill displays>\n!expect:<The answer expected for the above example>\nAnswer for the user query',
      designCode:
        '::bodyBackground #ffffff\n::bodyBackgroundImage \n::userMessageBoxBackground #0077e5\n::userMessageTextColor #ffffff\n::botMessageBoxBackground #f8f8f8\n::botMessageTextColor #455a64\n::botIconColor #000000\n::botIconImage ',
      configCode:
        "::allow_bot_only_on_own_sites no\n!Write all the domains below separated by commas on which you want to enable your chatbot\n::allowed_sites \n!Choose if you want to enable the default susi skills or not\n::enable_default_skills yes\n!Choose if you want to enable chatbot in your devices or not\n::enable_bot_in_my_devices no\n!Choose if you want to enable chatbot in other user's devices or not\n::enable_bot_for_other_users no",
    };
  }

  saveDraft = () => {
    let designCode = this.state.designCode.replace(/#/g, '');
    let skillData = {
      group: this.state.groupValue,
      language: this.state.languageValue,
      name: this.state.expertValue,
      buildCode: this.state.buildCode,
      designCode: designCode,
      configCode: this.state.configCode,
    };
    let object = JSON.stringify(skillData);
    let url;
    url = urls.API_URL + '/cms/storeDraft.json?object=' + object;
    $.ajax({
      url: url,
      dataType: 'jsonp',
      crossDomain: true,
      success: function(data) {
        this.setState({
          openSnackbar: true,
          msgSnackbar: 'Successfully saved draft of your chatbot.',
        });
      }.bind(this),
      error: function(error) {
        this.setState({
          openSnackbar: true,
          msgSnackbar: "Couldn't save the draft. Please try again.",
        });
      }.bind(this),
    });
  };

  getDraftBotDetails = id => {
    let url = urls.API_URL + '/cms/readDraft.json?id=' + id;
    $.ajax({
      url: url,
      dataType: 'jsonp',
      crossDomain: true,
      success: function(data) {
        if (data.drafts[id]) {
          let skillName = data.drafts[id].name;
          let skillLanguage = data.drafts[id].language;
          let skillGroup = data.drafts[id].group;
          let buildCode = data.drafts[id].buildCode;
          let designCode = data.drafts[id].designCode;
          let configCode = data.drafts[id].configCode;
          designCode.replace('bodyBackground', 'bodyBackground #');
          designCode.replace(
            'userMessageBoxBackground',
            'userMessageBoxBackground #',
          );
          designCode.replace('userMessageTextColor', 'userMessageTextColor #');
          designCode.replace(
            'botMessageBoxBackground',
            'botMessageBoxBackground #',
          );
          designCode.replace('botMessageTextColor', 'botMessageTextColor #');
          designCode.replace('botIconColor', 'botIconColor #');
          this.setState({
            groupValue: skillGroup,
            languageValue: skillLanguage,
            expertValue: skillName,
            buildCode,
            designCode,
            configCode,
            loaded: true,
          });
        } else {
          this.setState({
            openSnackbar: true,
            msgSnackbar:
              "Couldn't get your draft details. Please reload the page.",
          });
        }
      }.bind(this),
      error: function(error) {
        this.setState({
          openSnackbar: true,
          msgSnackbar: "Couldn't get your drafts. Please reload the page.",
        });
      }.bind(this),
    });
  };

  getBotDetails = (name, group, language) => {
    let url;
    url =
      urls.API_URL +
      // eslint-disable-next-line
      `/cms/getSkill.json?group=${group}&language=${language}&skill=${name}&private=1&access_token=` +
      cookies.get('loggedIn');
    $.ajax({
      url: url,
      dataType: 'jsonp',
      jsonp: 'callback',
      crossDomain: true,
      success: function(data) {
        let text = data.text;
        let buildCode = '::name' + text.split('::name')[1];
        let designCode =
          '::bodyBackground ' +
          text.split('::bodyBackground ')[1].split('::name')[0];
        let configCode =
          '::allow_bot_only_on_own_sites' +
          text
            .split('::allow_bot_only_on_own_sites')[1]
            .split('::bodyBackground')[0];
        const imageNameMatch = buildCode.match(/^::image\s(.*)$/m);
        let imagePreviewUrl;
        if (imageNameMatch[1] !== 'images/susi_image.jpg') {
          imagePreviewUrl = `${
            urls.API_URL
          }/cms/getImage.png?access_token=${cookies.get(
            'loggedIn',
          )}&language=${language}&group=${group}&image=${imageNameMatch[1]}`;
        } else {
          imagePreviewUrl = this.state.image;
        }
        let savedSkillOld = {
          OldGroup: group,
          OldLanguage: language,
          OldSkill: name,
          old_image_name: imageNameMatch[1].replace('images/', ''),
        };
        this.setState(
          {
            buildCode: buildCode,
            designCode: designCode,
            configCode: configCode,
            loaded: true,
            image: imagePreviewUrl,
            imageUrl: imageNameMatch[1],
            updateSkillNow: true,
            savedSkillOld,
            groupValue: group,
            languageValue: language,
            expertValue: name,
          },
          () => this.generateDesignData(),
        );
      }.bind(this),
      error: function(err) {
        console.log(err);
        this.setState({
          loaded: true,
          msgSnackbar: "Error! Couldn't fetch skill",
          openSnackbar: true,
        });
      }.bind(this),
    });
  };

  generateDesignData = () => {
    let code = this.state.designCode;
    const bodyBackgroundMatch = code.match(/^::bodyBackground\s(.*)$/m);
    const bodyBackgroundImageMatch = code.match(
      /^::bodyBackgroundImage\s(.*)$/m,
    );
    const userMessageBoxBackgroundMatch = code.match(
      /^::userMessageBoxBackground\s(.*)$/m,
    );
    const userMessageTextColorMatch = code.match(
      /^::userMessageTextColor\s(.*)$/m,
    );
    const botMessageBoxBackgroundMatch = code.match(
      /^::botMessageBoxBackground\s(.*)$/m,
    );
    const botMessageTextColorMatch = code.match(
      /^::botMessageTextColor\s(.*)$/m,
    );
    const botIconColorMatch = code.match(/^::botIconColor\s(.*)$/m);
    const botIconImageMatch = code.match(/^::botIconImage\s(.*)$/m);
    let designData = {};
    if (bodyBackgroundMatch) {
      designData.botbuilderBackgroundBody = bodyBackgroundMatch[1];
    }
    if (bodyBackgroundImageMatch) {
      designData.botbuilderBodyBackgroundImg = bodyBackgroundImageMatch[1];
    }
    if (userMessageBoxBackgroundMatch) {
      designData.botbuilderUserMessageBackground =
        userMessageBoxBackgroundMatch[1];
    }
    if (userMessageTextColorMatch) {
      designData.botbuilderUserMessageTextColor = userMessageTextColorMatch[1];
    }
    if (botMessageBoxBackgroundMatch) {
      designData.botbuilderBotMessageBackground =
        botMessageBoxBackgroundMatch[1];
    }
    if (botMessageTextColorMatch) {
      designData.botbuilderBotMessageTextColor = botMessageTextColorMatch[1];
    }
    if (botIconColorMatch) {
      designData.botbuilderIconColor = botIconColorMatch[1];
    }
    if (botIconImageMatch) {
      designData.botbuilderIconImg = botIconImageMatch[1];
    }
    this.setState({ designData });
  };

  getQueryStringValue = key => {
    return decodeURIComponent(
      window.location.search.replace(
        new RegExp(
          '^(?:.*[&\\?]' +
            encodeURIComponent(key).replace(/[.+*]/g, '\\$&') +
            '(?:\\=([^&]*))?)?.*$',
          'i',
        ),
        '$1',
      ),
    );
  };

  handleNext = () => {
    const { stepIndex } = this.state;
    this.setState({
      stepIndex: stepIndex + 1,
      finished: stepIndex >= 3,
      commitMessage: 'Created Bot ' + this.state.expertValue,
    });
  };

  handlePrev = () => {
    const { stepIndex } = this.state;
    if (stepIndex > 0) {
      this.setState({ stepIndex: stepIndex - 1 });
    }
  };

  updateSettings = themeSettingsString => {
    this.setState({
      designCode: themeSettingsString.code,
      designData: themeSettingsString,
    });
  };

  sendInfoToProps = values => {
    this.setState({ ...values, buildCode: values.code });
  };

  updateConfiguration = code => {
    this.setState({ configCode: code });
  };

  onChangePreferUiView = prefer => {
    if (prefer === 'ui') {
      if (this.state.preferUiView === 'code') {
        this.setState({ preferUiView: 'conversation' });
      } else {
        return null;
      }
    } else {
      this.setState({ preferUiView: prefer });
    }
  };

  getStepContent(stepIndex) {
    switch (stepIndex) {
      case 0:
        return (
          <Build
            sendInfoToProps={this.sendInfoToProps}
            code={this.state.buildCode}
            imageFile={this.state.file}
            image={this.state.image}
            imageUrl={this.state.imageUrl}
            onImageChange={() => this.setState({ imageChanged: true })}
            preferUiView={this.state.preferUiView}
            onChangePreferUiView={this.onChangePreferUiView}
          />
        );
      case 1:
        return (
          <Design
            updateSettings={this.updateSettings}
            code={this.state.designCode}
            preferUiView={this.state.preferUiView}
            onChangePreferUiView={this.onChangePreferUiView}
          />
        );
      case 2:
        return (
          <Configure
            updateConfiguration={this.updateConfiguration}
            code={this.state.configCode}
            preferUiView={this.state.preferUiView}
            onChangePreferUiView={this.onChangePreferUiView}
          />
        );
      case 3:
        return (
          <Deploy
            group={this.state.groupValue}
            language={this.state.languageValue}
            skill={this.state.expertValue}
          />
        );
      default:
    }
  }

  setStep = stepIndex => {
    this.setState({
      stepIndex,
      commitMessage: 'Created Bot ' + this.state.expertValue,
    });
  };

  handlePreviewToggle = () => {
    let { slideState } = this.state;
    if (slideState === 2) {
      this.setState({
        slideState: 1,
        colBuild: 8,
        colPreview: 4,
        prevButton: 0,
      });
    } else if (slideState === 1) {
      this.setState({
        slideState: 2,
        colBuild: 12,
        colPreview: 0,
        prevButton: 1,
      });
    }
  };

  handleCommitMessageChange = event => {
    this.setState({
      commitMessage: event.target.value,
    });
  };

  saveClick = () => {
    // save the skill on the server
    let self = this;
    let code = this.state.buildCode;
    code = self.state.configCode + '\n' + self.state.designCode + '\n' + code;
    code = '::author_email ' + cookies.get('emailId') + '\n' + code;
    code = '::protected Yes\n' + code;
    if (!cookies.get('loggedIn')) {
      notification.open({
        message: 'Not logged In',
        description: 'Please login and then try to create/edit a skill',
        icon: <Icon type="close-circle" style={{ color: '#f44336' }} />,
      });
      return 0;
    }

    if (!new RegExp(/.+\.\w+/g).test(self.state.imageUrl)) {
      notification.open({
        message: 'Error Processing your Request',
        description: 'image must be in format of images/imageName.jpg',
        icon: <Icon type="close-circle" style={{ color: '#f44336' }} />,
      });
      return 0;
    }

    this.setState({
      savingSkill: true,
    });

    let form = new FormData();
    if (this.state.updateSkillNow) {
      form.append('OldGroup', this.state.savedSkillOld.OldGroup);
      form.append('OldLanguage', this.state.savedSkillOld.OldLanguage);
      form.append('OldSkill', this.state.savedSkillOld.OldSkill);
      form.append('old_image_name', this.state.savedSkillOld.old_image_name);

      form.append('NewGroup', this.state.groupValue);
      form.append('NewLanguage', this.state.languageValue);
      form.append(
        'NewSkill',
        this.state.expertValue.trim().replace(/\s/g, '_'),
      );

      form.append('changelog', this.state.commitMessage);
      form.append('imageChanged', this.state.imageChanged);
      form.append('new_image_name', this.state.imageUrl.replace('images/', ''));
      form.append('image_name_changed', this.state.imageChanged);
    } else {
      form.append('group', this.state.groupValue);
      form.append('language', this.state.languageValue);
      form.append('skill', this.state.expertValue.trim().replace(/\s/g, '_'));
      form.append('image_name', this.state.imageUrl.replace('images/', ''));
    }
    if (this.state.file) {
      form.append('image', this.state.file);
    } else {
      form.append('image', '');
    }
    form.append('content', code);
    form.append('access_token', cookies.get('loggedIn'));
    form.append('private', '1');

    let settings = {
      async: true,
      crossDomain: true,
      url:
        urls.API_URL +
        '/cms/' +
        (this.state.updateSkillNow ? 'modifySkill.json' : 'createSkill.json'),
      method: 'POST',
      processData: false,
      contentType: false,
      mimeType: 'multipart/form-data',
      data: form,
    };

    $.ajax(settings)
      .done(function(response) {
        let data = JSON.parse(response);
        if (data.accepted === true) {
          let savedSkillOld = {
            OldGroup: self.state.groupValue,
            OldLanguage: self.state.languageValue,
            OldSkill: self.state.expertValue.trim().replace(/\s/g, '_'),
            old_image_name: self.state.imageUrl.replace('images/', ''),
          };
          self.setState(
            {
              savingSkill: false,
              savedSkillOld,
              updateSkillNow: true,
              imageChanged: false,
              skillName: savedSkillOld.OldSkill,
              skillGroup: savedSkillOld.OldGroup,
              skillLanguage: savedSkillOld.OldLanguage,
            },
            () => self.handleNext(),
          );
          notification.open({
            message: 'Accepted',
            description: 'Your Bot has been saved',
            icon: <Icon type="check-circle" style={{ color: '#00C853' }} />,
          });
        } else {
          self.setState({
            savingSkill: false,
          });
          notification.open({
            message: 'Error Processing your Request',
            description: String(data.message),
            icon: <Icon type="close-circle" style={{ color: '#f44336' }} />,
          });
        }
      })
      .fail(function(jqXHR, textStatus) {
        self.setState({
          savingSkill: false,
        });
        notification.open({
          message: 'Error Processing your Request',
          description: String(textStatus),
          icon: <Icon type="close-circle" style={{ color: '#f44336' }} />,
        });
      });
  };

  check = () => {
    if (this.state.updateSkillNow) {
      this.setStep(3);
    } else {
      this.setState({
        openSnackbar: true,
        msgSnackbar:
          'Please save the chatbot in Configure tab before deploying.',
      });
    }
  };

  render() {
    if (!cookies.get('loggedIn')) {
      return (
        <div>
          <StaticAppBar {...this.props} />
          <div>
            <p style={styles.loggedInError}>
              Please login to create the Web Bot.
            </p>
          </div>
        </div>
      );
    }
    const { stepIndex } = this.state;
    const contentStyle = { margin: '0 16px' };
    return (
      <div>
        <StaticAppBar {...this.props} />
        <div style={styles.home} className="botbuilder-page-wrapper">
          <Grid fluid>
            <Row>
              <Col
                className="botbuilder-col"
                md={this.state.colBuild}
                style={{
                  display: this.state.colBuild === 0 ? 'none' : 'block',
                }}
              >
                <div style={styles.mainPage}>
                  {!this.state.loaded ? (
                    <div className="center">
                      <CircularProgress size={62} color="#4285f5" />
                      <h4>Loading</h4>
                    </div>
                  ) : (
                    <div>
                      <Stepper activeStep={stepIndex} linear={false}>
                        <Step>
                          <StepButton onClick={() => this.setStep(0)}>
                            Build
                          </StepButton>
                        </Step>
                        <Step>
                          <StepButton onClick={() => this.setStep(1)}>
                            Design
                          </StepButton>
                        </Step>
                        <Step>
                          <StepButton onClick={() => this.setStep(2)}>
                            Configure
                          </StepButton>
                        </Step>
                        <Step>
                          <StepButton onClick={() => this.check()}>
                            Deploy
                          </StepButton>
                        </Step>
                      </Stepper>
                      <div style={contentStyle}>
                        <div>{this.getStepContent(stepIndex)}</div>
                        <div style={{ marginTop: '20px' }} />
                      </div>
                    </div>
                  )}
                </div>
                <div
                  style={{
                    display: stepIndex === 3 ? 'none' : 'block',
                    padding: '0px 30px',
                  }}
                >
                  {stepIndex === 2 ? (
                    <TextField
                      floatingLabelText="Commit message"
                      floatingLabelFixed={true}
                      hintText="Enter Commit Message"
                      style={{ width: '100%' }}
                      value={this.state.commitMessage}
                      onChange={this.handleCommitMessageChange}
                    />
                  ) : null}
                  {this.state.stepIndex === 2 ? (
                    <div style={{ float: 'left', paddingTop: '20px' }}>
                      <RaisedButton
                        label="Save Draft"
                        onTouchTap={this.saveDraft}
                      />
                    </div>
                  ) : null}
                  <div
                    style={{
                      float: 'right',
                      paddingLeft: '20px',
                      paddingTop: this.state.stepIndex === 2 ? '20px' : '0px',
                    }}
                  >
                    {stepIndex < 2 ? (
                      <RaisedButton
                        label={'Next'}
                        backgroundColor={colors.header}
                        labelColor="#fff"
                        onTouchTap={this.handleNext}
                      />
                    ) : null}
                    {stepIndex === 2 ? (
                      <RaisedButton
                        label={
                          // eslint-disable-next-line
                          this.state.savingSkill ? (
                            <CircularProgress color="#ffffff" size={32} />
                          ) : this.state.updateSkillNow ? (
                            'Update and Deploy'
                          ) : (
                            'Save and Deploy'
                          )
                        }
                        backgroundColor={colors.header}
                        labelColor="#fff"
                        onTouchTap={this.saveClick}
                      />
                    ) : null}
                  </div>
                  {this.state.stepIndex < 2 ? (
                    <RaisedButton
                      label="Save Draft"
                      onTouchTap={this.saveDraft}
                    />
                  ) : null}
                  <div
                    style={{
                      float: 'right',
                      paddingTop: this.state.stepIndex === 2 ? '20px' : '0px',
                    }}
                  >
                    {stepIndex !== 0 && stepIndex !== 3 ? (
                      <RaisedButton
                        label="Back"
                        backgroundColor={colors.header}
                        labelColor="#fff"
                        onTouchTap={this.handlePrev}
                      />
                    ) : null}
                    {stepIndex === 0 ? (
                      <Link to="/botbuilder">
                        <RaisedButton label="Cancel" />
                      </Link>
                    ) : null}
                  </div>
                </div>
              </Col>
              {this.state.prevButton === 1 ? (
                <div className="preview-button">
                  <span title="See Preview">
                    <ChevronLeft
                      className="botbuilder-chevron"
                      onClick={this.handlePreviewToggle}
                      style={styles.chevronButton}
                    />
                  </span>
                </div>
              ) : null}
              <Col
                className="botbuilder-col"
                xs={12}
                md={this.state.colPreview}
                style={{
                  display: this.state.colPreview === 0 ? 'none' : 'block',
                  paddingTop: '25px',
                }}
              >
                <Paper
                  style={styles.paperStyle}
                  className="botBuilder-page-card"
                  zDepth={1}
                >
                  <span title="collapse preview">
                    <ChevronRight
                      className="botbuilder-chevron"
                      onClick={this.handlePreviewToggle}
                      style={styles.chevron}
                    />
                  </span>
                  <br className="display-mobile-only" />
                  <h2 className="center">Preview</h2>
                  <div
                    style={{
                      position: 'relative',
                      overflow: 'hidden',
                      marginTop: '20px',
                    }}
                  >
                    <Preview
                      designData={this.state.designData}
                      skill={this.state.buildCode}
                      botBuilder={true}
                    />
                  </div>
                </Paper>
              </Col>
            </Row>
          </Grid>
        </div>
        <Snackbar
          open={this.state.openSnackbar}
          message={this.state.msgSnackbar}
          autoHideDuration={2000}
          onRequestClose={() => {
            this.setState({ openSnackbar: false });
          }}
        />
      </div>
    );
  }
}

const styles = {
  home: {
    width: '100%',
  },
  mainPage: {
    paddingTop: '25px',
    paddingRight: '15px',
  },
  bg: {
    textAlign: 'center',
    padding: '30px',
  },
  paperStyle: {
    width: '100%',
    marginTop: '20px',
    position: 'relative',
  },
  tabStyle: {
    color: 'rgb(91, 91, 91)',
  },
  loggedInError: {
    textAlign: 'center',
    textTransform: 'uppercase',
    fontWeight: 'bold',
    marginBottom: '100px',
    fontSize: '50px',
    marginTop: '300px',
  },
  chevron: {
    position: 'absolute',
    left: '0',
    top: '0',
    width: '35px',
    height: '35px',
    color: 'rgb(158, 158, 158)',
    cursor: 'pointer',
    display: window.innerWidth < 769 ? 'none' : 'inherit',
  },
  chevronButton: {
    position: 'absolute',
    left: '4px',
    top: '4px',
    width: '35px',
    height: '35px',
    color: 'white',
    cursor: 'pointer',
    display: window.innerWidth < 769 ? 'none' : 'inherit',
  },
};
BotWizard.propTypes = {
  templates: PropTypes.array,
};

export default BotWizard;
