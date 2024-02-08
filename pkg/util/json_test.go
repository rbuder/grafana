package util_test

import (
	"testing"

	"github.com/stretchr/testify/require"

	"github.com/grafana/grafana/pkg/util"
)

func TestSearchJSONForGroups(t *testing.T) {
	t.Parallel()
	tests := []struct {
		Name                 string
		UserInfoJSONResponse []byte
		GroupsAttributePath  string
		ExpectedResult       []string
		ExpectedError        error
	}{
		{
			Name:                 "Given an invalid user info JSON response",
			UserInfoJSONResponse: []byte("{"),
			GroupsAttributePath:  "attributes.groups",
			ExpectedResult:       []string{},
			ExpectedError:        util.ErrFailedToUnmarshalJSON,
		},
		{
			Name:                 "Given an empty user info JSON response and empty JMES path",
			UserInfoJSONResponse: []byte{},
			GroupsAttributePath:  "",
			ExpectedResult:       []string{},
			ExpectedError:        util.ErrNoAttributePathSpecified,
		},
		{
			Name:                 "Given an empty user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte{},
			GroupsAttributePath:  "attributes.groups",
			ExpectedResult:       []string{},
			ExpectedError:        util.ErrEmptyJSON,
		},
		{
			Name: "Given a simple user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte(`{
		"attributes": {
			"groups": ["foo", "bar"]
		}
}`),
			GroupsAttributePath: "attributes.groups[]",
			ExpectedResult:      []string{"foo", "bar"},
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.Name, func(t *testing.T) {
			t.Parallel()
			actualResult, err := util.SearchJSONForStringSliceAttr(
				test.GroupsAttributePath, test.UserInfoJSONResponse)
			if test.ExpectedError == nil {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, test.ExpectedError)
			}
			require.Equal(t, test.ExpectedResult, actualResult)
		})
	}
}

func TestSearchJSONForRole(t *testing.T) {
	t.Parallel()
	tests := []struct {
		Name                 string
		UserInfoJSONResponse []byte
		RoleAttributePath    string
		ExpectedResult       string
		ExpectedError        error
	}{
		{
			Name:                 "Given an invalid user info JSON response",
			UserInfoJSONResponse: []byte("{"),
			RoleAttributePath:    "attributes.role",
			ExpectedResult:       "",
			ExpectedError:        util.ErrFailedToUnmarshalJSON,
		},
		{
			Name:                 "Given an empty user info JSON response and empty JMES path",
			UserInfoJSONResponse: []byte{},
			RoleAttributePath:    "",
			ExpectedResult:       "",
			ExpectedError:        util.ErrNoAttributePathSpecified,
		},
		{
			Name:                 "Given an empty user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte{},
			RoleAttributePath:    "attributes.role",
			ExpectedResult:       "",
			ExpectedError:        util.ErrEmptyJSON,
		},
		{
			Name: "Given a simple user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte(`{
	"attributes": {
		"role": "admin"
	}
}`),
			RoleAttributePath: "attributes.role",
			ExpectedResult:    "admin",
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.Name, func(t *testing.T) {
			t.Parallel()
			actualResult, err := util.SearchJSONForStringAttr(test.RoleAttributePath, test.UserInfoJSONResponse)
			if test.ExpectedError == nil {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, test.ExpectedError)
			}
			require.Equal(t, test.ExpectedResult, actualResult)
		})
	}
}

func TestSearchJSONForEmail(t *testing.T) {
	t.Parallel()
	tests := []struct {
		Name                 string
		UserInfoJSONResponse []byte
		EmailAttributePath   string
		ExpectedResult       string
		ExpectedError        error
	}{
		{
			Name: "Given a simple user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte(`{
	"attributes": {
		"email": "grafana@localhost"
	}
}`),
			EmailAttributePath: "attributes.email",
			ExpectedResult:     "grafana@localhost",
		},
		{
			Name: "Given a user info JSON response with e-mails array and valid JMES path",
			UserInfoJSONResponse: []byte(`{
	"attributes": {
		"emails": ["grafana@localhost", "admin@localhost"]
	}
}`),
			EmailAttributePath: "attributes.emails[0]",
			ExpectedResult:     "grafana@localhost",
		},
		{
			Name: "Given a nested user info JSON response and valid JMES path",
			UserInfoJSONResponse: []byte(`{
	"identities": [
		{
			"userId": "grafana@localhost"
		},
		{
			"userId": "admin@localhost"
		}
	]
}`),
			EmailAttributePath: "identities[0].userId",
			ExpectedResult:     "grafana@localhost",
		},
	}

	for _, test := range tests {
		test := test
		t.Run(test.Name, func(t *testing.T) {
			t.Parallel()
			actualResult, err := util.SearchJSONForStringAttr(test.EmailAttributePath, test.UserInfoJSONResponse)
			if test.ExpectedError != nil {
				require.NoError(t, err)
			} else {
				require.ErrorIs(t, err, test.ExpectedError)
			}
			require.Equal(t, test.ExpectedResult, actualResult)
		})
	}
}
