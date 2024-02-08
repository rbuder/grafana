package responsewriter_test

import (
	"io"
	"net/http"
	"testing"

	grafanaresponsewriter "github.com/grafana/grafana/pkg/services/apiserver/endpoints/responsewriter"
	"github.com/stretchr/testify/require"
)

func fakeHandler(w http.ResponseWriter, r *http.Request) {
	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OK"))
}

func TestResponseAdapter(t *testing.T) {
	client := &http.Client{
		Transport: &roundTripperFunc{
			ready: make(chan struct{}),
			fn: func(req *http.Request) (*http.Response, error) {
				w := grafanaresponsewriter.NewAdapter(req.Context())
				go func() {
					fakeHandler(w, req)
					w.Close()
				}()
				r := w.Response()
				return r, nil
			},
		},
	}
	close(client.Transport.(*roundTripperFunc).ready)
	req, err := http.NewRequest("GET", "http://localhost/test", nil)
	require.NoError(t, err)

	resp, err := client.Do(req)
	require.NoError(t, err)

	defer resp.Body.Close()
	bodyBytes, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	require.Equal(t, "OK", string(bodyBytes))
}

type roundTripperFunc struct {
	ready chan struct{}
	fn    func(req *http.Request) (*http.Response, error)
}

func (f *roundTripperFunc) RoundTrip(req *http.Request) (*http.Response, error) {
	if f.fn == nil {
		<-f.ready
	}
	res, err := f.fn(req)
	return res, err
}
