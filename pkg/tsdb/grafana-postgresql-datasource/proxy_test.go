package postgres

import (
	"fmt"
	"testing"

	"github.com/grafana/grafana/pkg/setting"
	"github.com/grafana/grafana/pkg/tsdb/sqleng"
	"github.com/grafana/grafana/pkg/tsdb/sqleng/proxyutil"
	"github.com/jackc/pgx/v5"
	pgxstdlib "github.com/jackc/pgx/v5/stdlib"
	"github.com/stretchr/testify/require"
)

func TestPostgresProxyDriver(t *testing.T) {
	settings := proxyutil.SetupTestSecureSocksProxySettings(t)
	proxySettings := setting.SecureSocksDSProxySettings{
		Enabled:      true,
		ClientCert:   settings.ClientCert,
		ClientKey:    settings.ClientKey,
		RootCA:       settings.RootCA,
		ProxyAddress: settings.ProxyAddress,
		ServerName:   settings.ServerName,
	}
	opts := proxyutil.GetSQLProxyOptions(proxySettings, sqleng.DataSourceInfo{UID: "1", JsonData: sqleng.JsonData{SecureDSProxy: true}}, "pg", "postgres")
	dbURL := "127.0.0.1:5432"
	cnnstr := fmt.Sprintf("postgres://auser:password@%s/db?sslmode=disable", dbURL)

	t.Run("Connector should use dialer context that routes through the socks proxy to db", func(t *testing.T) {
		pgxConf, err := pgx.ParseConfig(cnnstr)
		// connector, err := pq.NewConnector(cnnstr)
		require.NoError(t, err)
		dialFunc, err := newPgxDialFunc(opts)
		require.NoError(t, err)

		// connector.Dialer(dialer)
		pgxConf.DialFunc = dialFunc

		db := pgxstdlib.OpenDB(*pgxConf)

		err = db.Ping()

		require.Contains(t, err.Error(), fmt.Sprintf("socks connect %s %s->%s", "tcp", settings.ProxyAddress, dbURL))
	})
}
