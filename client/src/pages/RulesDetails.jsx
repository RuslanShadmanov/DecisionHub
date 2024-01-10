import React, { useEffect, useState } from "react";
import ReactFlow, {
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Panel,
  useReactFlow,
} from "reactflow";
import "reactflow/dist/style.css";
import ConditionalNode from "../components/Nodes/ConditionalNode";
import AttributeNode from "../components/Nodes/ArrtibuteNode";
import OutputNode from "../components/Nodes/OutputNode";
import styled, { useTheme } from "styled-components";
import { CircularProgress, MenuItem, Select } from "@mui/material";
import {
  ArrowBackRounded,
  DeleteOutlineRounded,
  FlipCameraAndroidOutlined,
  RuleRounded,
  SaveRounded,
} from "@mui/icons-material";
import { useNavigate, useParams } from "react-router-dom";
import { getRuleById, updateRule, deleteRule } from "../api";
import { useDispatch, useSelector } from "react-redux";
import { openSnackbar } from "../redux/reducers/snackbarSlice";

const FlexDisplay = styled.div`
  display: flex;
  flex-direction: row;
  gap: 12px;
  align-items: center;
`;

const DeleteButton = styled.div`
  border: 2px solid ${({ theme }) => theme.red + 90};
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 12px;
  color: ${({ theme }) => theme.red};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  span {
    font-weight: 500;
  }
  &:hover {
    background-color: ${({ theme }) => theme.red + 10};
  }
`;

const TextButton = styled.div`
  border-radius: 8px;
  padding: 4px 6px;
  font-size: 12px;
  color: ${({ theme }) => theme.text_secondary};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 4px;
  cursor: pointer;
  &:hover {
    color: ${({ theme }) => theme.text_primary};
    background-color: ${({ theme }) => theme.text_secondary + 10};
  }
`;

const Button = styled.div`
  border-radius: 6px;
  padding: 8px 14px;
  margin: 6px 0px;
  font-size: 12px;
  color: ${({ theme }) => theme.white};
  background-color: ${({ theme }) => theme.primary};
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.primary + 90};

    ${({ outlined, theme }) =>
      outlined &&
      `
    background-color: ${theme.green + 20};
    `}
  }

  ${({ disabled, theme }) =>
    disabled &&
    `
    background-color: ${theme.primary + 50};
    cursor: not-allowed;
  `}

  ${({ outlined, theme }) =>
    outlined &&
    `
    background-color: transparent;
    border: 1px solid ${theme.green + 90};
    color: ${theme.green};
    `}
`;

const nodeTypes = {
  attributeNode: AttributeNode,
  conditionalNode: ConditionalNode,
  outputNode: OutputNode,
};

const RulesDetails = () => {
  const { id } = useParams();
  const { reload } = useSelector((state) => state.rule);
  const { setViewport } = useReactFlow();

  //Hooks
  const theme = useTheme();
  const navigate = useNavigate();
  const dispath = useDispatch();

  const [inputAttributes, setInputAttributes] = useState([]);
  const [outputAttributes, setOutputAttributes] = useState([]);
  const [nodes, setNodes, onNodesChange] = useNodesState();
  const [edges, setEdges, onEdgesChange] = useEdgesState();
  const [rule, setRule] = useState();

  //loader
  const [loading, setLoading] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveVersionLoading, setSaveVersionLoading] = useState(false);

  //Functions

  const getRule = async () => {
    setLoading(true);
    const token = localStorage.getItem("decisionhub-token-auth-x4");
    await getRuleById(id, token)
      .then((res) => {
        setRule(res.data);
        setInputAttributes(res.data.inputAttributes);
        setOutputAttributes(res.data.outputAttributes);
        setLoading(false);
      })
      .catch((err) => {
        dispath(
          openSnackbar({
            message: err.response.data.message,
            severity: "error",
          })
        );
        setLoading(false);
      });
  };

  useEffect(() => {
    getRule();
  }, [reload]);

  useEffect(() => {
    if (rule) {
      const { nodes, edges } = JSON.parse(rule.condition);
      //add input and output attributes to nodes
      nodes.forEach((node) => {
        if (node.type === "attributeNode") {
          node.data.label = rule.title;
          node.data.descryption = rule.descryption;
        }
        node.data.inputAttributes = inputAttributes;
        node.data.outputAttributes = outputAttributes;
      });
      setNodes(nodes);
      setEdges(edges);
      setViewport({ x: 200, y: 0, zoom: 1 }, { duration: 800 });
    }
  }, [rule, inputAttributes, outputAttributes, reload]);

  // update rule
  const saveRule = async () => {
    setSaveLoading(true);
    const updatedRule = {
      ...rule,
      condition: JSON.stringify({ nodes, edges }),
    };
    const token = localStorage.getItem("decisionhub-token-auth-x4");
    await updateRule(id, updatedRule, token)
      .then((res) => {
        setRule(res.data);
        setInputAttributes(res.data.inputAttributes);
        setOutputAttributes(res.data.outputAttributes);
        dispath(
          openSnackbar({
            message: "Rule Saved Successfully",
            severity: "success",
          })
        );
        setSaveLoading(false);
      })
      .catch((err) => {
        dispath(
          openSnackbar({
            message: err.response.data.message,
            severity: "error",
          })
        );
        setSaveLoading(false);
      });
  };

  // Delete Rule
  const deleterule = async () => {
    setLoading(true);
    const token = localStorage.getItem("decisionhub-token-auth-x4");
    await deleteRule(id, token)
      .then(() => {
        setLoading(false);
        navigate("/rules/");
        dispath(
          openSnackbar({
            message: "Rule Deleted Successfully",
            severity: "success",
          })
        );
      })
      .catch((err) => {
        dispath(
          openSnackbar({
            message: err.response.data.message,
            severity: "error",
          })
        );
      });
  };

  return (
    <div style={{ height: "100%" }}>
      {loading ? (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
        </div>
      ) : (
        <ReactFlow
          nodeTypes={nodeTypes}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          nodesDraggable={true}
          elementsSelectable={true}
          setNodes={setNodes}
          setEdges={setEdges}
          fitView={true}
        >
          <Background />
          <Controls />
          <Panel position="top-left">
            <TextButton onClick={() => navigate("/rules/")}>
              <ArrowBackRounded sx={{ fontSize: "16px" }} />
              Back to Rules
            </TextButton>
          </Panel>
          <Panel position="top-right">
            <FlexDisplay>
              <Select
                value="1.1"
                autoWidth
                displayEmpty
                size="small"
                sx={{
                  color: theme.text_primary,
                  border: `1px solid ${theme.text_secondary + 90}`,
                  borderRadius: "8px",
                  padding: "0px",
                  fontSize: "12px",
                  ".MuiSvgIcon-root ": {
                    fill: `${theme.text_secondary} !important`,
                  },
                }}
              >
                <MenuItem value="1.1">Version: 1.0</MenuItem>
                <MenuItem value="2.2">Version: 1.1</MenuItem>
                <MenuItem value="3.3">Version: 1.2</MenuItem>
              </Select>
              <Button
                outlined
                onClick={() => navigate(`/test/${rule.id}`)}
                style={{ padding: "10px", borderRadius: "50%" }}
              >
                <RuleRounded sx={{ fontSize: "16px" }} />
              </Button>
              <DeleteButton
                onClick={() => deleterule()}
                style={{ padding: "10px", borderRadius: "50%" }}
              >
                <DeleteOutlineRounded sx={{ fontSize: "16px" }} />
              </DeleteButton>
            </FlexDisplay>
          </Panel>
          <Panel position="bottom-right">
            <FlexDisplay>
              <Button disabled={saveLoading} onClick={() => saveRule()}>
                {saveLoading ? (
                  <>
                    <CircularProgress
                      sx={{
                        color: "inherit",
                        width: "14px !important",
                        height: "14px !important",
                      }}
                    />
                    Saving...
                  </>
                ) : (
                  <>
                    <SaveRounded sx={{ fontSize: "14px" }} />
                    Save Rule
                  </>
                )}
              </Button>
              <Button
                disabled={saveLoading}
                onClick={() => saveRule()}
                style={{ background: theme.secondary }}
              >
                {saveVersionLoading ? (
                  <>
                    <CircularProgress
                      sx={{
                        color: "inherit",
                        width: "14px !important",
                        height: "14px !important",
                      }}
                    />
                    Creating Version...
                  </>
                ) : (
                  <>
                    <FlipCameraAndroidOutlined sx={{ fontSize: "14px" }} />
                    Save New Version
                  </>
                )}
              </Button>
            </FlexDisplay>
          </Panel>
        </ReactFlow>
      )}
    </div>
  );
};

export default RulesDetails;
