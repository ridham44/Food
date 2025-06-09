const Enum = require('enum');

module.exports = {
    Status: new Enum({
        Active: '1',
        Inactive: '0',
    }),
    isLogin: {
        Login: '1',
        Logout: '0',
    },
    deviceType: {
        Web: 'WEB',
        Mobile: 'MOBILE',
    },
    roleType: {
        AdminUser: '1',
        Tenant: '2',
        Customer: '3',
    },
    EmailType: {
        Gmail: '0',
        SendGrid: '1',
        Other: '2',
    },
    SocialLogin: {
        Google: '1',
        Facebook: '2',
    },
    httpMethod: {
        Get: 'GET',
        Post: 'POST',
    },
    Type: {
        Text: '0',
        TextArea: '1',
        Number: '2',
        Decimal: '3',
        Dropdown: '4',
        Checkbox: '5',
        MultiDropdown: '6',
        RadioButton: '7',
        DateTime: '8',
        Attachment: '9',
        Date: '10',
    },
    EmailSendingType: {
        To: '0',
        Cc: '1',
        Bcc: '2',
    },
    SentEmailType: {
        Draft: '0',
        Schedule: '1',
        Sent: '2',
        Received: '3',
    },
    MenuOrderType: {
        Group: '1',
        Module: '2',
        Right: '3',
    },
    bannerType: {
        Web: '1',
        Mobile: '2',
    },
    EmailVerify: {
        NotVerify: '0',
        Verify: '1',
    },
    StatusTenantAndStore: {
        Pending: '0',
        Approved: '1',
        InProgress: '2',
        Rejected: '3',
    },
    DisplayType: {
        CheckBox: '0',
        RadioButton: '1',
        TextBox: '2',
    },
    isVariation: {
        Yes: '1',
        No: '0',
    },
    HasQuantity: {
        Yes: '1',
        No: '0',
    },
};
