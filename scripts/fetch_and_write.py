"""
Calls the NetSuite RESTlet (getFieldLocations.js) using Token-Based
Authentication and writes the result to data.json at the repo root.

Requires these environment variables (set as GitHub repo secrets):
  NETSUITE_RESTLET_URL      e.g. https://<account>.restlets.api.netsuite.com/app/site/hosting/restlet.nl?script=123&deploy=1
  NETSUITE_ACCOUNT_ID       e.g. 8215914
  NETSUITE_CONSUMER_KEY
  NETSUITE_CONSUMER_SECRET
  NETSUITE_TOKEN_ID
  NETSUITE_TOKEN_SECRET
"""

import json
import os
import sys

import requests
from requests_oauthlib import OAuth1

def main():
    url = os.environ["NETSUITE_RESTLET_URL"]
    account_id = os.environ["NETSUITE_ACCOUNT_ID"]

    auth = OAuth1(
        client_key=os.environ["NETSUITE_CONSUMER_KEY"],
        client_secret=os.environ["NETSUITE_CONSUMER_SECRET"],
        resource_owner_key=os.environ["NETSUITE_TOKEN_ID"],
        resource_owner_secret=os.environ["NETSUITE_TOKEN_SECRET"],
        signature_method="HMAC-SHA256",
        realm=account_id,
    )

    resp = requests.get(url, auth=auth, timeout=30)
    resp.raise_for_status()
    payload = resp.json()

    with open("data.json", "w") as f:
        json.dump(payload, f, indent=2)

    print(f"Wrote {len(payload.get('engineers', []))} engineers to data.json")

if __name__ == "__main__":
    try:
        main()
    except Exception as e:
        print(f"Refresh failed: {e}", file=sys.stderr)
        sys.exit(1)
