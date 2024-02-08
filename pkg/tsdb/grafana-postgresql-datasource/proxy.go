package postgres

import (
	"context"
	"net"

	sdkproxy "github.com/grafana/grafana-plugin-sdk-go/backend/proxy"
)

type PgxDialFunc = func(ctx context.Context, network string, address string) (net.Conn, error)

func newPgxDialFunc(opts *sdkproxy.Options) (PgxDialFunc, error) {
	dialer, err := sdkproxy.New(opts).NewSecureSocksProxyContextDialer()
	if err != nil {
		return nil, err
	}

	dialFunc :=
		func(ctx context.Context, network string, addr string) (net.Conn, error) {
			return dialer.Dial(network, addr)
		}

	return dialFunc, nil
}
